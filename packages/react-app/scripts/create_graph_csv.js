// import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
const {ApolloClient, InMemoryCache, HttpLink, gql} = require('@apollo/client');
const fetch = require('cross-fetch');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const subgraphUri = "http://localhost:8000/subgraphs/name/unit4";

const client = new ApolloClient({
    uri: subgraphUri,
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: subgraphUri, fetch })
});

const tokensQuery = `
query {
    users {
        id
        address
        units {
        unit {
            address
        }
        balance
        }
    }    
}
`

const header = [
    {id: 'userAddress', title: 'UserAddress'},
    {id: 'unitAddress', title: 'UnitAddress'},
    {id: 'balance', title: 'Balance'}
]

client.query({
    query: gql(tokensQuery)
})
.then(data => {
    users = data.data.users;    
    const now = Date.now();
    const csvWriter = createCsvWriter({
        path: './tokens.' + now + '.file.csv',
        header: header
    });
    const records = users.flatMap(user => user.units.map(userUnit => { return {userAddress: user.address, unitAddress: userUnit.unit.address, balance: userUnit.balance}}))
    csvWriter.writeRecords(records)       // returns a promise
    .then(() => {
        console.log('...Done');
    });
})
.catch(err => { console.log("Error fetching data: ", err) });