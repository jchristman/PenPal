export default `import {
	OptionsWithUri
} from 'request';
    
import {
    IHookFunctions,
    IWebhookFunctions,
    IExecuteFunctions,
    IExecuteSingleFunctions,
    ILoadOptionsFunctions,
} from "n8n-core";

import {
    IDataObject,
    INodeTypeDescription,
    INodeType,
    INodeProperties,
    IWebhookResponseData
} from "n8n-workflow";

import {
    node,
    trigger
} from "./NODE_NAME_REPLACE_ME-settings.json";

async function penpalGraphqlRequest(
    this:
        IHookFunctions |
        IExecuteFunctions |
        IExecuteSingleFunctions |
        ILoadOptionsFunctions,
    graphql_query: string,
    variables: any = {},
    uri?: string
): Promise<any> {
    // TODO: Add credentials? Maybe running this on loopback is sufficient
    //const credentials = this.getCredentials('penpalApiCredentials');

    let body = {
        query: graphql_query,
        variables
    };

    const options: OptionsWithUri = {
        method: 'POST',
        headers: {
            'Accept': 'applications/json',
        },
        uri: uri || 'http://localhost:3000/graphql',
        json: true,
        body
    };

    let responseData = await this.helpers.request!(options);
    return responseData;
}

export class NODE_NAME_REPLACE_ME implements INodeType {
    description: INodeTypeDescription = {
        displayName: node.displayName,
        name: node.name,
        icon: node.icon, // file:lambda.png   OR   fa:font-awesome-name
        group: ["trigger", "penpal"],
        version: 1,
        description: node.description,
        defaults: {
            name: node.displayName,
            color: "#3471eb"
        },
        inputs: [],
        outputs: ["main"],
        webhooks: [
            {
                name: "default",
                httpMethod: "POST",
                responseMode: "onReceived",
                path: "webhook"
            }
        ],
        properties: <INodeProperties[]>node.properties
    };

    webhookMethods = {
        default: {
            async checkExists(this: IHookFunctions): Promise<boolean> {
                const webhookData = this.getWorkflowStaticData("node");

                if (webhookData.webhookId === undefined) {
                    // No webhook id is set so no webhook can exist
                    return false;
                }

                // Webhook got created before so check if it still exists
                const checkN8nWebhook: string = \`query CheckN8nWebhookQuery($id: ID!) {
                    checkN8nWebhook(id: $id) {
                        id
                        url
                    }
                }\`;
                
                let responseData;
                try {
                    responseData = await penpalGraphqlRequest.call(this, checkN8nWebhook, { id: webhookData.webhookId });
                } catch (e) {
                    if (e.message.includes("[404]:")) {
                        // Webhook does not exist
                        delete webhookData.webhookId;
                        return false;
                    }

                    // Some error occured
                    throw e;
                }

                if (responseData?.data?.checkN8nWebhook === null) {
                    // Webhook does not exist
                    delete webhookData.webhookId;
                    return false;
                }

                // If it did not error then the webhook exists
                return true;
            },
            async create(this: IHookFunctions): Promise<boolean> {
                const webhookUrl = this.getNodeWebhookUrl("default") as string;
                const webhookData = this.getWorkflowStaticData("node");

                let responseData;
                const createN8nWebhook: string = \`mutation CreateN8nWebhookMutation($name: String!, $url: String!, $type: String!, $trigger: String!) {
                    createN8nWebhook(name: $name, url: $url, type: $type, trigger: $trigger) {
                        id
                        url
                        name
                        type
                        trigger
                    }
                }\`;

                try {
                    responseData = await penpalGraphqlRequest.call(
                        this,
                        createN8nWebhook,
                        { name: trigger.name, url: webhookUrl, type: trigger.type, trigger: trigger.trigger }
                    );
                } catch (e) {
                    throw e;
                }

                if (
                    responseData.data.createN8nWebhook.id === undefined
                ) {
                    // Required data is missing so was not successful
                    throw new Error(
                        "PenPal webhook creation response did not contain the expected data."
                    );
                }

                webhookData.webhookId = responseData.data.createN8nWebhook.id as string;

                return true;
            },
            async delete(this: IHookFunctions): Promise<boolean> {
                const webhookData = this.getWorkflowStaticData("node");

                const deleteN8nWebhook: string = \`mutation DeleteN8nWebhookMutation($id: ID!) {
                    deleteN8nWebhook(id: $id)
                }\`;

                if (webhookData.webhookId !== undefined) {
                    try {
                        await penpalGraphqlRequest.call(
                            this,
                            deleteN8nWebhook,
                            { id: webhookData.webhookId }
                        );
                    } catch (e) {
                        return false;
                    }

                    // Remove from the static workflow data so that it is clear
                    // that no webhooks are registered anymore
                    delete webhookData.webhookId;
                }

                return true;
            }
        }
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const bodyData = this.getBodyData();
        const returnData: IDataObject[] = [];

        returnData.push({
            ...bodyData
        });

        return {
            workflowData: [this.helpers.returnJsonArray(returnData)]
        };
    }
}`;
