import { IExecuteFunctions } from "n8n-core";
import {
    INodeExecutionData,
    INodeParameters,
    INodeType,
    INodeTypeDescription,
    NodeParameterValue
} from "n8n-workflow";

export class Join implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Join",
        name: "join",
        icon: "fa:object-group",
        group: ["transform"],
        version: 1,
        description: "Combines an array of strings on a character",
        defaults: {
            name: "Join",
            color: "#408000"
        },
        inputs: ["main"],
        outputs: ["main"],
        properties: [
            {
                displayName: "Join character",
                name: "join_char",
                type: "string",
                default: ",",
                description:
                    "The field that represents the character that will be used to join picked fields together",
                required: true
            },
            {
                displayName: "Array",
                name: "array",
                type: "string",
                default: "",
                description:
                    "The array that will be joined. Pick a 'raw value' using an expression",
                required: true
            },
            {
                displayName: "Field",
                name: "field",
                type: "string",
                default: "",
                description:
                    "Not needed if an array of strings. If an array of objects, pick a field name to extract a string"
            }
        ]
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        let returnData: INodeExecutionData[];
        const items = this.getInputData();

        let join_char = this.getNodeParameter("join_char", 0);
        let array = this.getNodeParameter("array", 0);
        let field = this.getNodeParameter("field", 0);

        let result = "";

        if (field !== undefined) {
            result = array.map((item) => item[field]).join(join_char);
        } else {
            result = array.join(join_char);
        }

        returnData = [{ json: { ...items[0].json, joined_string: result } }];

        return this.prepareOutputData(returnData);
    }
}
