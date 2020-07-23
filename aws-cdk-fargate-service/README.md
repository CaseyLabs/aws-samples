# aws-cdk-fargate-service

This repository contains an example TypeScript project for the [AWS Cloud Development Kit](https://github.com/awslabs/aws-cdk). The project deploys:

- An AWS VPC (2 public/private subnets across 2 availability zones with 1 NAT gateway)
- AWS ECS/Fargate Cluster (with two-tasks running for high-availability)
- Application Load Balancer
- Autoscaling rules
- AWS ECR + related AWS CodeBuild project

(https://github.com/CaseyLabs/aws-samples/blob/master/aws-cdk-fargate-service/image.png)

## Requirements

You will need the following installed on your desktop:

- <a href="https://aws.amazon.com/cli/">AWS CLI</a>
- AWS credentials with read/write permissions to: ECS, EC2, ECR, CodeBuild
- <a href="https://nodejs.org/en/download/">Node.js v10 or higher</a>


## Building the project

Open a Terminal and run:

```
git clone https://github.com/CaseyLabs/aws-samples.git

cd aws-samples/aws-cdk-fargate-service

npm install -g aws-cdk typescript

npm install
```

## Deploying the CDK infrastructure

In Terminal, run:

```
cdk deploy  // Deploys the CloudFormation template
```

# Afterwards

```
$ cdk destroy  // Destroys the infrastructure created by CDK
```
