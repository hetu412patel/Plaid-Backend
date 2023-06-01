const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")

const dotenv = require("dotenv");
dotenv.config();

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.CLIENT_ID,
            'PLAID-SECRET': process.env.SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}));
app.use(express.json())

const port = process.env.PORT 

app.post('/create_link_token', async function (request, response) {
    const plaidRequest = {
      user: {
        client_user_id: 'user',
      },
      client_name: 'Plaid Test App',
      products: ['auth','transfer'],
      language: 'en',
      redirect_uri: 'http://localhost:3000/',
      country_codes: ['US'],
      link_customization_name: "payment_ui"
    };
    try {
      const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
      // console.log("createTokenResponse",createTokenResponse);
      response.json(createTokenResponse.data);
    } catch (error) {
        console.log(error);
      response.status(500).json({message: "Failure"})
    }
  });

  app.post('/exchange_public_token', async function (request, response) {
    const publicToken = request.body.publicToken;   
    try {
      const plaidResponse = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });
      console.log("plaidResponse",plaidResponse?.data?.item_id);
      const accessToken = plaidResponse?.data?.access_token;
      const item_id = plaidResponse?.data?.item_id
      response.json({ accessToken,item_id });
    } catch (error) {
      console.log(error);
      response.status(500).json({message : "Failure"})
    }
  })

  app.post("/auth", async function (request, response){
    try{
      const access_token = request.body.accessTokenData
      const plaidRequest = { access_token }
       
      const plaidResponse = await plaidClient.authGet(plaidRequest);
      response.status(200).json({data : plaidResponse?.data})    
    }catch(error){
      console.log(error);
      response.status(500).json({message : "Failure"})
    }
  })

  // app.post('/transactions-data', async function(request, response) {
  //   const transactionRequest = {
  //     access_token: request.body.accessTokenData,
  //     start_date: '2018-01-01',
  //     end_date: '2020-02-01'
  //   }
  //   try {
  //     const transactionResponse = await plaidClient.transactionsGet(transactionRequest);
  //     console.log("response",transactionResponse?.data);
  //     let transactions = transactionResponse?.data?.transactions;
  //     // console.log("transactions",transactions);
  //     let accounts = transactionResponse?.data?.accounts;
  //     // console.log("accounts",accounts);
  //     const total_transactions = transactionResponse?.data?.total_transactions;
  //     // console.log("total_transactions",total_transactions);
  //     response.status(200).json({data: transactions})
  //   } catch{(err) => {
  //     console.log(err);
  //     response.status(500).json({message : "Failure", err})
  //   }}
  // })

// app.get("/recipient-create", async function(request, response){
//   // Using BACS, without IBAN or address
// const recipientRequest = {
//   name: 'John Doe',
//   bacs: {
//     account: '26207729',
//     sort_code: '560029',
//   },
// };
// try {
//   const recipientResponse = await plaidClient.paymentInitiationRecipientCreate(recipientRequest);
//   console.log("paymentResponse",recipientResponse?.data);
//   const recipientID = recipientResponse?.data?.recipient_id;
//   const requestId = recipientResponse?.data?.request_id
//   // console.log("recipientID",recipientID);
//   // console.log("requestId",requestId);
//   response.status(200).json({data:recipientID })
// } catch (error) {
//   console.log(error);
//   response.status(500).json({message: "Failure"})
// }
// })

// app.post("/payment-create", async function(request,response){
//     const paymentRequest = {
//     recipient_id: request.body.recipentId,
//     reference: 'TestPayment',
//     amount: {
//         currency: 'GBP',
//         value: 100.0,
//       },
//     };  
//   try {
//   const paymentResponse = await plaidClient.paymentInitiationPaymentCreate(paymentRequest);
//   console.log("paymentResponse",paymentResponse?.data);
//   const paymentID = paymentResponse?.data?.payment_id;
//   // console.log("paymentID",paymentID);
//   const status = paymentResponse?.data?.status;
//   // console.log("status",status);
//   response.status(200).json({paymentID})
//   } catch (error) {
//     console.log(error);
//     response.status(500).json({message:"Failure"})
//   }
// })

// app.post("/payment-get", async function(request, response){
//   const getPaymentRequest = {
//     payment_id: request.body.paymentId,
//   };
//   try {
//     const getPaymentResponse = await plaidClient.paymentInitiationPaymentGet(getPaymentRequest);
//     console.log("getPaymentResponse",getPaymentResponse?.data);
//     // const paymentToken = getPaymentResponse?.data?.payment_token;
//     // const paymentTokenExpirationTime = getPaymentResponse?.data?.payment_token_expiration_time;
//     response.status(200).json({data : getPaymentResponse?.data})
//   } catch (error) {
//     console.log(error);
//     response.status(500).json({message: "failure"})
//   }
// })

// payment_ui = new customize ui for transfer
app.post("/transfer-intent", async function(request, response){
  const intentRequest = {
    mode: 'PAYMENT',
    amount: '12.34',
    description: 'payment',
    ach_class: 'ppd',
    user: {
      legal_name: 'Leslie Knope',
    },
    account_id : request.body.account_id
  };
  try {
    const intentResponse = await plaidClient.transferIntentCreate(intentRequest);
    console.log("intentResponse",intentResponse?.data);
    response.json({data : intentResponse?.data})
  } catch (error) {
    console.log(error);
    response.status(500).json({message:"failure"})
  }
})

app.post("/transfer-link-token-initial", async function(request, response){
  const linkTokenParams = {
    user: {
      client_user_id: 'user',
    },
    client_name: 'Plaid Test App',
    products: ['transfer'],
    language: 'en',
    country_codes: ['US'],
    transfer: {
      intent_id : request.body.intent_id,
    },
    access_token : request.body.accessTokenData,
    link_customization_name: "payment_ui"
  }
  try {
    const linkTokenResponse = await plaidClient.linkTokenCreate(linkTokenParams);
    console.log("linkTokenResponse",linkTokenResponse?.data);
    response.json({data: linkTokenResponse?.data})
  } catch (error) {
    console.log(error);
    response.json({message: error.message})
  }
})

// app.post("/intent-get", async function(request, response){  
//   const intentGetRequest = {
//     transfer_intent_id: request.body.intent_id,
//   };
  
//   try {
//     const intentGetResponse = await plaidClient.transferIntentGet(intentGetRequest);
//     const intentGet = intentGetResponse?.data
//     response.json({intentGet})
//   } catch (error) {
//     response.json({message : error.message})
//   }
// })

// app.post("/authorization-create", async function(request,response){
//   const authorizeRequest = {
//     access_token: request.body.accessTokenData,
//     account_id: request.body.account_id, 
//     type: 'debit',
//     network: 'ach',
//     amount: '12.34',
//     ach_class: 'ppd',
//     user: {
//       legal_name: 'Leslie Knope',
//     },
//   };
//   try {
//     const authorizeResponse = await plaidClient.transferAuthorizationCreate(authorizeRequest);
//     console.log("authorizeResponse",authorizeResponse?.data);
//     const authorizationId = authorizeResponse.data.authorization.id;
//     console.log("authorizationId",authorizationId);
//     response.json({authorizationId})
//   } catch (error) {
//     response.json({message: error})
//   }
// })

// app.post("/trasfer-create", async function(request,response){
//   const transferRequest = {
//     amount: '12.34',
//     description: 'payment',
//     access_token: request.body.accessTokenData,
//     account_id: request.body.account_id,
//     authorization_id: request.body.authorizationId,
//   };
//   try {
//     const transferResponse = await plaidClient.transferCreate(transferRequest);
//     const transfer = transferResponse?.data?.transfer;
//     console.log("transfer", transfer);
//     response.json({transfer})
//   } catch (error) {
//     response.json({message: error.message})
//   }
// })

app.listen(port, ()=>{
    console.log(`connection is setup at port ${port}`);
})  