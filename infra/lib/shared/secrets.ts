import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export function createDatabaseSecret(scope: Construct): Secret {
  return new Secret(scope, 'DatabaseSecret', {
    secretName: 'nerdwork-dbsecret',
    description: 'Secret for Nerdwork Aurora PostgreSQL admin credentials',
    generateSecretString: {
      secretStringTemplate: JSON.stringify({
        username: 'nerdwork_admin',
      }),
      excludePunctuation: true,
      includeSpace: false,
      generateStringKey: 'password',
    },
  });
}
