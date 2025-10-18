import { MongoClient } from 'mongodb';
import { Provider } from '@nestjs/common';

export const DatabaseProvider: Provider = {
  provide: 'MONGO_CLIENT',
  useFactory: async () => {
    const uri =
      'mongodb+srv://alihamza:1uEiKEgyCfNg57qb@cluster0.rtxdhjc.mongodb.net/navy?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db('navy');
  },
};
