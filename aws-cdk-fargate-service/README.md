# aws-cdk-fargate-service

This repository contains an example TypeScript project for the [AWS Cloud Development Kit](https://github.com/awslabs/aws-cdk).

This project deploys a simple Node REST API app (running on Amazon Linux), with the following AWS infrastructure:

- An AWS VPC
    - 2 public/private subnets
    - 2 availability zones
    - 1 NAT gateway

- Application Load Balancer

- Security Groups

- AWS ECS/Fargate Cluster
     - with two-tasks running for high-availability
     - Autoscaling rules for CPU/mem usage

- AWS ECR + related AWS CodeBuild project

![Netork Diagram](https://github.com/CaseyLabs/aws-samples/blob/master/aws-cdk-fargate-service/image.png)


## Requirements

You will need the following installed on your desktop:

- <a href="https://aws.amazon.com/cli/">AWS CLI</a>
- AWS credentials with read/write permissions to: ECS, EC2, ECR, CodeBuild
- <a href="https://nodejs.org/en/download/">Node.js v10 or higher</a>


**Note: this project will deploy to the DEFAULT profile defined in your AWS CLI configuration. Make sure you're deploying to the correct AWS account!**


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
# Deploys the CloudFormation template:

cdk deploy  
```

When the CDK project successfully deploys, it will output the DNS name of the load balancer:

```
Outputs:
AwsCdkStack.loadbalancerDNS = AwsCd-ALBAE-NHLIHWVROHJA-772658320.us-west-2.elb.amazonaws.com
```

In your Terminal, assign the DNS name to an environment variable:

```
LB_DNS="AwsCd-ALBAE-NHLIHWVROHJA-772658320.us-west-2.elb.amazonaws.com"
```

## Testing the API

The simplest way to test the API is browse to the load balancer in a web browser. For example:

http://AwsCd-ALBAE-NHLIHWVROHJA-772658320.us-west-2.elb.amazonaws.com

You can also test the API using the `curl` command in your Terminal:

#### GET /

```
curl -i http://$LB_DNS

{"response":"This is a GET method."}

```


#### POST /

```
curl -i -x POST http://$LB_DNS

{"response":"This is a POST method."}
```

#### PUT /

```
curl -i -x PUT http://$LB_DNS

{"response":"This is a PUT method."}
```

#### DELETE /

```
curl -i -x DELETE http://$LB_DNS

{"response":"This is a DELETE method."}
```


## Cleaning Up

In Terminal, run:

```
# Destroy the infrastructure created by CDK:

cdk destroy  
```
