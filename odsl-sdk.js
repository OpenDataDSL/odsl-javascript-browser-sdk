// ODSL REST URL
host = "https://odsl-dev.azurewebsites.net/api/";

// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "d3742f5f-3d4d-4565-a80a-ebdefaab8d08",
        authority: "https://login.microsoft.com/common",
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            logLevel: msal.LogLevel.Trace,
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        console.log(message);
                        return;
                }
            },
        },
    },
    telemetry: {
        application: {
            appName: "MSAL Browser V2 Default Sample",
            appVersion: "1.0.0",
        },
    },
};

// Scopes for id token to be used at ODSL Platform endpoints.
const loginRequest = {
    scopes: ["api://opendatadsl/api_user"],
};

const myMSALObj = new msal.PublicClientApplication(msalConfig);

myMSALObj.initialize().then(() => {
    // Redirect: once login is successful and redirects with tokens, call Graph API
    myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });
})

function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0];
            myMSALObj.setActiveAccount(activeAccount);
            accountId = activeAccount.homeAccountId;
        }
    }
}

async function getTokenPopup(request, account) {
    request.redirectUri = "/redirect"
    return await myMSALObj
        .acquireTokenSilent(request)
        .catch(async (error) => {
            console.log("silent token acquisition fails.");
            if (error instanceof msal.InteractionRequiredAuthError) {
                console.log("acquiring token using popup");
                return myMSALObj.acquireTokenPopup(request).catch((error) => {
                    console.error(error);
                });
            } else {
                console.error(error);
            }
        });
}

function callODSL(endpoint, accessToken, callback) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log('request made to ODSL API at: ' + new Date().toString());

    fetch(endpoint, options)
        .then(response => response.json())
        .then(response => callback(response))
        .catch(error => console.log(error));
}

async function get(service, source, id, callback) {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
		id = encodeURIComponent(id);
		var url = new URL(this.host + service + "/v1/" + source + "/" + id);
		callODSL(url, response.accessToken, callback);
    }
}

async function list(service, source, filter, callback) {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
		var url = new URL(this.host + service + "/v1/" + source);
        if (filter != undefined) {
            url.searchParams.set("_filter", JSON.stringify(filter));
        }
        callODSL(url, response.accessToken, callback);
    }
}
