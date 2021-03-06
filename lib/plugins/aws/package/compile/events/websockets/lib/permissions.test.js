'use strict';

const expect = require('chai').expect;
const AwsCompileWebsocketsEvents = require('../index');
const Serverless = require('../../../../../../../Serverless');
const AwsProvider = require('../../../../../provider/awsProvider');

describe('#compilePermissions()', () => {
  let awsCompileWebsocketsEvents;

  beforeEach(() => {
    const serverless = new Serverless();
    serverless.setProvider('aws', new AwsProvider(serverless));
    serverless.service.provider.compiledCloudFormationTemplate = { Resources: {} };

    awsCompileWebsocketsEvents = new AwsCompileWebsocketsEvents(serverless);

    awsCompileWebsocketsEvents.websocketsApiLogicalId
      = awsCompileWebsocketsEvents.provider.naming.getWebsocketsApiLogicalId();
  });

  it('should create a permission resource for every event', () => {
    awsCompileWebsocketsEvents.validated = {
      events: [
        {
          functionName: 'First',
          route: '$connect',
        },
        {
          functionName: 'Second',
          route: '$disconnect',
        },
      ],
    };

    return awsCompileWebsocketsEvents.compilePermissions().then(() => {
      const resources = awsCompileWebsocketsEvents.serverless.service.provider
        .compiledCloudFormationTemplate.Resources;

      expect(resources).to.deep.equal({
        FirstLambdaPermissionWebsockets: {
          Type: 'AWS::Lambda::Permission',
          DependsOn: [
            'WebsocketsApi',
            'FirstLambdaFunction',
          ],
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'FirstLambdaFunction', 'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: {
              'Fn::Join': [
                '',
                [
                  'apigateway.',
                  {
                    Ref: 'AWS::URLSuffix',
                  },
                ],
              ],
            },
          },
        },
        SecondLambdaPermissionWebsockets: {
          Type: 'AWS::Lambda::Permission',
          DependsOn: [
            'WebsocketsApi',
            'SecondLambdaFunction',
          ],
          Properties: {
            FunctionName: {
              'Fn::GetAtt': [
                'SecondLambdaFunction',
                'Arn',
              ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: {
              'Fn::Join': [
                '',
                [
                  'apigateway.',
                  {
                    Ref: 'AWS::URLSuffix',
                  },
                ],
              ],
            },
          },
        },
      });
    });
  });
});
