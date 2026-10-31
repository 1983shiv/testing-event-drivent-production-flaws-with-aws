# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   type-check the project
* `npm run watch`   watch for changes and type-check
* `npm run test`    perform the jest unit tests
* `npm run verify`  type-check and run all regression tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

The upload bucket allows browser uploads from `http://localhost:3000` by default.
Set `WEB_ORIGIN` to the exact origin of the deployed web app (for example,
`https://applications.example.com`) before synthesizing or deploying the stack.

GitHub Actions runs the web build and infrastructure verification on pushes and
pull requests. Require the **Build and regression tests** check in repository
branch protection to prevent merging changes that fail verification.
