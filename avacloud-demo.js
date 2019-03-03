var request = require('request');
var avaCloudClient = require('@dangl/avacloud-client-node');
var fs = require('fs');

// This is the Dangl.Identity OpenID token endpoint
const danglIdentityTokenEndpoint = 'https://identity.dangl-it.com/connect/token';

async function returnAvaProject(clientId, clientSecret, gaebFile) {
    const accessToken = await getAccessToken(clientId, clientSecret);
    if (!accessToken) {
        return { error: 'Failed to get access token' };
    }

    const avaProject = await getAvaProject(accessToken, gaebFile);

    if (!avaProject) {
        return { error: 'Failed to convert GAEB to AVA' };
    }

    return avaProject;
}

// This function retrieves the JWT Token
async function getAccessToken(clientId, clientSecret) {
    if (!clientId || !clientSecret) {
        console.log('Please provide values for clientId and clientSecret. You can find more info in the tutorial at www.dangl-it.com or the AVACloud documenation.');
        return null;
    }
    const clientCredentialsRequest = new Promise(function (resolve, reject) {
        request.post(danglIdentityTokenEndpoint, {
            auth: {
                username: clientId,
                password: clientSecret
            },
            body: 'grant_type=client_credentials&scope=avacloud',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, function (err, resp, body) {
            if (err) {
                console.log('Error');
                reject(err);
            } else {
                resolve(body);
            }
        });
    });
    try {
        const clientCredentialsResult = await clientCredentialsRequest;
        accessToken = JSON.parse(clientCredentialsResult)['access_token'];
        if (!accessToken) {
            console.log(clientCredentialsResult);
            console.log('Failed to obtain an access token. Have you read the documentation and set up your OAuth2 client?');
            return null;
        }
        return accessToken;
    } catch (e) {
        console.log(e);
        console.log('Failed to obtain an access token. Have you read the documentation and set up your OAuth2 client?');
        return null;
    }
}

// This function sends the GAEB file to AVACloud and returns the project model
async function getAvaProject(accessToken, gaebFile) {
    const apiClient = new avaCloudClient.GaebConversionApi();
    apiClient.accessToken = accessToken;

    // Files sent to the Node backend are saved as temporary files,
    // here it's being read again
    var gaebFileBlob = fs.readFileSync(gaebFile.path);

    var opts = {
        value: gaebFileBlob,
        options: {
            filename: gaebFile.name,
            contentType: 'application/octet-stream'
        }
    };

    var avaConversionResult = await apiClient.gaebConversionConvertToAva(opts);

    if (avaConversionResult.statusCode < 200 || avaConversionResult.statusCode >= 300) {
        console.log('Failed to convert the GAEB input file');
        return null;
    } else {
        return avaConversionResult.body;
    }
}

module.exports = {
    returnAvaProject: returnAvaProject
};
