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

    // helloLambda.currentVersion.addAlias('prod') // 1. Add an alias which versions the lambda and deploy

    // 2. Retrieve prod version
    const prodVersion = lambda.Version.fromVersionArn(
      this,
      "prod",
      `${helloLambda.functionArn}:1`
    );

    // 3. Create new weighted alias and make changes to lambda handler to see the difference when testing, dont forget to build before next cdk deploy!
    const canaryAlias = prodVersion.addAlias("canary", {
      additionalVersions: [
        { version: helloLambda.currentVersion, weight: 0.5 },
      ],
    });

    // 4. Create API Gateway
    const api = new RestApi(this, "helloApi", {
      restApiName: "Hello Service",
    });

    const hello = api.root.addResource("hello");
    // 5. Reference the canary alias
    const getAllIntegration = new LambdaIntegration(canaryAlias);
    hello.addMethod("GET", getAllIntegration);
  }
}
