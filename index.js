require('dotenv').config()
const express = require('express');
const app = express();
const axios = require('axios'); 

const shopifyStore = process.env.SURPRICE_PARCEL_STORE;
const apiToken = process.env.SURPRICE_PARCEL_API;
const fs = require('fs');


async function fetchAllCustomerData() {
    let url = `https://${shopifyStore}/admin/api/2023-10/customers.json?limit=250`; 
    let allCustomers = [];
    let hasMore = true;
    let chunkCounter = 1;

    while (hasMore) {
        console.log(`Fetching chunk ${chunkCounter}...`);
        try {
            const response = await axios.get(url, {
                headers: {
                    'X-Shopify-Access-Token': apiToken,
                },
            });

            const customers = response.data.customers;
            allCustomers.push(...customers); 
            const linkHeader = response.headers.link;
            if (linkHeader && linkHeader.includes('rel="next"')) {
                url = linkHeader.match(/<([^>]+)>; rel="next"/)[1]; 
                chunkCounter++;
            } else {
                hasMore = false;  
            }
        } catch (error) {
            console.error('Error fetching customers:', error.response?.data || error.message);
            break;
        }
    }

    return allCustomers;
}

function addIndexToCustomers(customers) {
    return customers.map((customer, index) => ({
        index: index + 1, 
        ...customer 
    }));
}

(async () => {
    const customers = await fetchAllCustomerData();
    console.log(`Total customers fetched: ${customers.length}`);

    const customersWithIndex = addIndexToCustomers(customers);

    try {
        fs.writeFileSync(`${shopifyStore}.json`, JSON.stringify(customersWithIndex, null, 2));
        console.log(`Customer data with index saved to ${shopifyStore}.json`);
    } catch (error) {
        console.error('Error saving customer data to file:', error);
    }
})();

app.listen('3000',()=>{
    console.log('running on 3000')
})