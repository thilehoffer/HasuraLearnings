/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

import { logger } from 'firebase-functions';

import {
  createTestAccount,
  createTransport,
  getTestMessageUrl,
} from 'nodemailer';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

const GET_PHOTO_QUERY = `query GetPhoto($id: uuid!) {
  photos_by_pk(id: $id) {
    photo_url
    description
  }
}
`;
export const notifyAboutComment = onRequest(async (request, response) => {
  try {
    const { event } = request.body;
    //logger.log(request.body);
    const { photo_id, comment } = event?.data?.new;
    // logger.log(photo_id);

    let bodyText = JSON.stringify({
      query: GET_PHOTO_QUERY,
      variables: { id: photo_id },
    });
    // logger.log(`  ${bodyText}`);

    const photoInfoQuery = await fetch('http://127.0.0.1:8080/v1/graphql', {
      method: 'POST',
      body: bodyText,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    let graphData = await photoInfoQuery.json();
    const { photo_url, description } = graphData.data.photos_by_pk;

    // logger.log(`graphDataReponse data: ${JSON.stringify(graphData.data)}`);
    const testAccount = await createTestAccount();
    const transporter = createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    const sentEmail = await transporter.sendMail({
      from: `"Firebase Function" <${testAccount.user}>`,
      to: 'toddhilehoffer@yahoo.com',
      subject: 'New Comment to the photo',
      html: `
        <html>
          <head></head>
          <body>
            <h1>Hi there!</h1>
            <br> <br>
            <p>You have got a new comment to your photo: <a href="${photo_url}">${description}</a> </p>
            <p>The comment text is: <i>${comment}</i></p>
          </body>
        </html>     
    `,
    });

    logger.log(getTestMessageUrl(sentEmail));

    response.status(200).send({ message: 'success' });
  } catch (error: any) {
    console.error(error);
    logger.log(error);
    response.status(500).send({
      message: `  Message:   ${error.message}`,
    });
  }
});
