import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { PolicyStatement, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { RemovalPolicy } from "@aws-cdk/core";
import { LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway";

export class WeightedLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const helloLambdaExecutionRole = new Role(
      this,
      "helloLambdaExecutionRole",
      {
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      }
    );

    helloLambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        resources: ["arn:aws:logs:eu-central-1:553424512867:*"],
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
      })
    );

    helloLambdaExecutionRole.addToPolicy(
      new PolicyStatement({
        resources: ["arn:aws:logs:eu-central-1:553424512867:*"],
        actions: ["logs:CreateLogGroup"],
      })
    );

    const helloLambda = new lambda.Function(this, "MyFunction", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "hello.handler",
      code: lambda.Code.fromAsset("src"),
      currentVersionOptions: {
        removalPolicy: RemovalPolicy.RETAIN,
      },
    });


    const prodVersion = lambda.Version.fromVersionArn(
      this,
      "prod",
      `${helloLambda.functionArn}:3`
    );

    prodVersion.addAlias("canary", {
      additionalVersions: [{ version: helloLambda.currentVersion, weight: 0.5 }],
    })

    // const api = new RestApi(this, 'itemsApi', {
    //   restApiName: 'Items Service'
    // });

    // const hello = api.root.addResource('hello');
    // const getAllIntegration = new LambdaIntegration(prodVersion);
    // hello.addMethod('GET', getAllIntegration);
  }
}
