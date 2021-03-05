import { IExecuteFunctions } from "n8n-core";
import {
    INodeExecutionData,
    INodeParameters,
    INodeType,
    INodeTypeDescription,
    NodeParameterValue
} from "n8n-workflow";

export class Clone implements INodeType {
    description: INodeTypeDescription = {
        displayName: "Clone",
        name: "clone",
        icon: "fa:clone",
        group: ["transform"],
        version: 1,
        description:
            "Clones a stream up to 4 times in order to perform multiple operations on the same data",
        defaults: {
            name: "Clone",
            color: "#408000"
        },
        inputs: ["main"],
        outputs: ["main", "main", "main", "main"],
        outputNames: ["0", "1", "2", "3"],
        properties: []
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const returnData: INodeExecutionData[][] = [[], [], [], []];
        let item: INodeExecutionData;

        const items = this.getInputData();

        // Iterate over all items and duplicate them into different data streams
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            item = items[itemIndex];
            for (
                let dataStreamIndex = 0;
                dataStreamIndex < returnData.length;
                dataStreamIndex++
            ) {
                returnData[dataStreamIndex].push(item);
            }
        }

        return returnData;
    }
}
