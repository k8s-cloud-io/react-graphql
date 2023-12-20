import {
    DocumentNode,
    GraphQLClientProps,
    KeyValuePair,
    MutationProps,
    QueryProps,
} from './props';
import {md5} from 'pure-md5';
import {GraphQLClientError, GraphQLOperationError} from "./GraphQLError";

export class GraphQLClient {
    private opts: GraphQLClientProps;
    constructor(props: GraphQLClientProps) {
        this.opts = props;
        if (!props) {
            throw new GraphQLClientError(
                'Unable to instanciate GraphQLClient: missing properties',
            );
        }
    }

    public query = (props: QueryProps): Promise<any> => {
        return this.request(props.query, props.variables, 'query');
    };

    public mutate = (props: MutationProps): Promise<any> => {
        return this.request(props.mutation, props.variables, 'mutation');
    };

    private request(
        document: DocumentNode,
        variables: KeyValuePair,
        requestType: string,
    ): Promise<any> {
        const operationType = document.definitions[0].operation;
        const operationName = document.definitions[0].name.value

        let data = {
            variables: variables || {},
            operationName
        };

        if (requestType === 'query') {
            if (operationType !== 'query') {
                throw new GraphQLOperationError(
                    'Unable to start request: operation must be of type query: ' + operationType,
                );
            }
            data = Object.assign(data, {
                query: document.toString(),
            });
        }

        if (requestType === 'mutation') {
            if (operationType !== 'mutation') {
                throw new GraphQLOperationError(
                    'Unable to start request: operation must be of type mutation',
                );
            }
            data = Object.assign(data, {
                query: document.toString(),
            });
        }

        const requestBody = JSON.stringify(data);
        const hash = `hash_${md5(requestBody)}`;
        if( this.opts.cache.has(hash) ) {
            // TODO extend object to resolved / error
            const cache = this.opts.cache.get(hash);
            return new Promise((resolve, _) => {
                resolve(cache);
            });
        }

        return new Promise((resolve, reject) => {
            fetch(this.opts.uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            })
                .then(async (result) => {
                    const json = await result.json();
                    if( json.data && json.data[operationName] ) {
                        // TODO extend object to resolved / error
                        this.opts.cache.put(hash, json.data);
                        resolve(json.data);
                        return;
                    }
                    if( !json.errors?.length ) {
                        resolve(json.data);
                        return;
                    }
                    reject(json.errors[0]);
                })
                // TODO extend object to resolved / error
                .catch((e) => reject(e));
        });
    }
}
