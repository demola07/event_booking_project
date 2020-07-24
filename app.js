require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const {
  graphqlHTTP
} = require('express-graphql')
const {
  buildSchema
} = require('graphql')

const connectDB = require('./config/db')

const Event = require('./models/event')

const app = express()

connectDB()

app.use(bodyParser.json())

app.use(
  '/graphql',
  graphqlHTTP({
    schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent (eventInput: EventInput): Event!
    }
      schema {
        query: RootQuery
        mutation: RootMutation
      }
    `),
    rootValue: {
      events: () => {
        return Event.find().then(result => {
          console.log(result);
          return result.map(event => {
            return { ...event._doc }
          })
        }).catch(err => {
          console.log(err);
        })
      },

      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: args.eventInput.price,
          date: new Date(args.eventInput.date)
        })

        return event.save().then(result => {
          console.log(result);
          return { ...result._doc }
        }).catch(err => {
          console.log(err)
          throw err;
        })
      }
    },
    graphiql: true
  })
)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server listening on PORT: ${PORT}`)
})