import express from 'express';
import {createClient} from 'redis';
import { prisma } from './db';
import cors from 'cors';

const client = await createClient()
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();


const app = express();
app.use(express.json());
app.use(cors());

app.post('/submission', async (req, res) => {
  
  const code = req.body.code;
  if (!code) {
    return res.status(400).send('Code is required');
  }

  const language = req.body.language;
  if (!language) {
    return res.status(400).send('Language is required');
  }

  const response = await prisma.submission.create({
    data: {
      code: code,
      language: language,
      status: 'PROCESSING',
    }
  });

  client.lPush('subscribers', JSON.stringify({ submissionId: response.id, code, language }));
  res.json({message: 'Processing started', submissionId: response.id});
});

app.get('/submission/:submissionId', async (req, res) => {
  const submissionId = req.params.submissionId;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return res.status(404).send('Submission not found');
  }

  res.json({ submission: submission });
});


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});