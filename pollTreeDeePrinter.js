import 'babel-polyfill';
import firebase from 'firebase';
import fetch from 'node-fetch';
import { checkStatus, parseJSON } from "./request.utils";

const app = firebase.initializeApp({
  databaseURL: 'https://bekk-lab.firebaseio.com',
});

const printerAddress = '10.0.50.35';
const apiLocation = `http://${printerAddress}/api/v1`;

const request = async (path: string) => {
  const requestStackTrace = new Error().stack;
  return fetch(`${apiLocation}${path}`)
    .then(checkStatus(requestStackTrace))
    .then(parseJSON);
};

const poll = async () => {
  const database = firebase.database();
  const threeDeePrinter = database.ref('/3dprint');

  try {
    const status = await request('/printer/status');
    console.log(status);
    await threeDeePrinter.child('/status').update({ status: status });
  } catch (err) {
    console.log("Status fetch failed");
  }

  try {
    const job = await request('/print_job');
    console.log(job);
    await threeDeePrinter.child('/job').update(job);
  } catch (err) {
    console.log("Job fetch failed");
    await threeDeePrinter.child('/job').remove();
  }

  firebase.database().goOffline();
};

poll();