import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import iam = require('@aws-cdk/aws-iam');
import codebuild = require("@aws-cdk/aws-codebuild");
import ecr = require("@aws-cdk/aws-ecr");


export class AwsCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ----------------------------
    // STACK VARIABLES
    // ----------------------------
    const env = "test";                 // Environment name
    const cidr = "10.0.0.0/16";         // VPC IP Range
    const azs = 2;                      // Number of availability zones to use in VPC


    // ----------------------------
    // NETWORKING
    // ----------------------------

    // VPC [create private/public subnets across multi-AZs]
    // ----------------------------------------------------
    const vpc = new ec2.Vpc(this, `${env}-vpc`, { 
      cidr,
      maxAzs: azs,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 1,
      subnetConfiguration: [ 
        { name: `${env}-public-`, subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: `${env}-private-`, subnetType: ec2.SubnetType.PRIVATE, cidrMask: 24 },
      ]
    });
      // Tags:
      vpc.node.applyAspect(new cdk.Tag('Environment', `${env}`));
      vpc.node.applyAspect(new cdk.Tag('Name', `${env}-vpc`));
    
    
    // Security Groups
    // ---------------

    // Public Web Access:
    const webSecurityGroup = new ec2.SecurityGroup(this, "publicWebSecurityGroup", {
      vpc,
      securityGroupName: `${env}-public-web-sg`,
      description: `[${env}] Allow HTTP/S traffic from the internet [Managed by CDK]`,
      allowAllOutbound: true,      
    });
      // Rules:
      webSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from anywhere');
      webSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS from anywhere');
      // Tags:
      webSecurityGroup.node.applyAspect(new cdk.Tag('Environment', `${env}`));


      // Application Load Balancer (ALB)
    // -------------------------------
    const lb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: webSecurityGroup,
    });
      // Tags:
      lb.node.applyAspect(new cdk.Tag('Environment', `${env}`));
      lb.node.applyAspect(new cdk.Tag('Name', `${env}-lb`));

    // Target Group (Load Balancer --> Fargate Service)
    const tg = new elbv2.ApplicationTargetGroup(this, "targetGroup", {
      vpc,
      port: 80,
      targetType: elbv2.TargetType.IP,
    });

    // Listen on port 80 to the world:
    const listener = lb.addListener('Listener', {
      port: 80,
      open: true,
    });
      
    // Forward listener to target group:
    listener.addTargetGroups("TG", {
      targetGroups: [tg]
    });


    // ----------------------------
    // CODE PIPELINE
    // ----------------------------

    // AWS ECR Image Repo (with vulnerability scanning)
    // -------------------------------------------------
    const repository = new ecr.Repository(this, "ECR", {
      repositoryName: `${env}-sample-image`,
      imageScanOnPush: true,
    });

    // AWS CodeBuild project (build sample app and push to ECR)
    // --------------------------------------------------------
    const buildProject = new codebuild.PipelineProject(this, "Build", {
      description: "sample-app build project",
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
        privileged: true
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            runtime_versions: {
                nodejs: 10
          },
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "$(aws ecr get-login --region $REGION --no-include-email)",
              "COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)",
              "IMAGE_TAG=${COMMIT_HASH:=latest}"
            ]
          },
          build: {
            commands: [
              "echo Build started on`date`",
              "git clone --depth 1 https://github.com/CaseyLabs/aws-samples.git",
              "docker build -f ./aws-samples/nodejs-restful-api/Dockerfile -t $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/test-sample-image:$IMAGE_TAG .",
              "docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/test-sample-image:$IMAGE_TAG",
            ]
          },
          post_build: {
            commands: ["echo Build completed on`date`"]
          }
        }
      }
      }),
    });
    
    
    // ----------------------------
    // CONTAINER ORCHESTRATION
    // ----------------------------

    // ECS Cluster
    // -----------
    const cluster = new ecs.Cluster(this, 'fargateCluster', {
      vpc: vpc,
      clusterName: `${env}-cluster`,
      containerInsights: true
    });
      // Tags:
      cluster.node.applyAspect(new cdk.Tag('Environment', `${env}`))

   
    // IAM Role - ECS Task Execution Role
    // ----------------------------------
    const ecsFargateServiceRole = new iam.Role(this, 'fargateTaskExecutionServiceRole', {
      roleName: `${env}-ecs-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });


    // Task Definition
    // ---------------
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'taskDefinition', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: ecsFargateServiceRole,
    });

     // Associate container to task defintion:
     taskDefinition
     .addContainer("sample-app", {
       image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
       //logging
     })
     .addPortMappings({
       containerPort: 80,
       hostPort: 80,
       protocol: ecs.Protocol.TCP
     });


    // Fargate Service
    // ---------------
    const fargateService = new ecs.FargateService(this, "fargateService", {
      serviceName: `${env}-sample-app`,
      cluster,
      taskDefinition,
      desiredCount: 2, // Let's make it highly-available!
      securityGroup: webSecurityGroup,
      //healthCheckGracePeriod: cdk.Duration.seconds(60),
    });
      // Tags:
      fargateService.node.applyAspect(new cdk.Tag('Environment', `${env}`));
      // Add service to target group:
      tg.addTarget(fargateService);


    // AutoScaling policies
    // --------------------
    const scaling = fargateService.autoScaleTaskCount({ maxCapacity: 4 });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
    });
    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 50,
    });
    scaling.scaleOnRequestCount("CountScaling", {
      requestsPerTarget: 100,
      targetGroup: tg
    });



    // --------------------------------------------------------------
    // FINAL: Output the DNS name where you can access the sample app
    // --------------------------------------------------------------
   
    new cdk.CfnOutput(this, "loadbalancerDNS", {
      value: lb.loadBalancerDnsName
    });

  }
}