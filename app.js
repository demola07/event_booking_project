require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const {
  graphqlHTTP
} = require('express-graphql')
const {
  buildSchema
} = require('graphql')
const bcrypt = require('bcryptjs')

const connectDB = require('./config/db')

const Event = require('./models/event')
const User = require('./models/user')

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

    type User {
      _id: ID!
      email: String!
      password: String
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      password: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent (eventInput: EventInput): Event!
      createUser(userInput: UserInput): User
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
          date: new Date(args.eventInput.date),
          creator: '5f1b70d90fa0f11c9018492d'
        })
        let createdEvent;

        return event.save().then(result => {
          createdEvent = { ...result._doc }

          return User.findById('5f1b70d90fa0f11c9018492d')
        })
          .then(user => {
            if (!user) {
              throw new Error('User not found')
            }
            user.createdEvents.push(event)
            return user.save()
          })
          .then(result => {
            return createdEvent
          })
          .catch(err => {
            console.log(err)
            throw err;
          })
      },

      createUser: (args) => {
        return User.findOne({ email: args.userInput.email }).then(user => {
          if (user) {
            throw new Error('User exists already')
          }
          return bcrypt.hash(args.userInput.password, 12)

        }).then(hashedPassword => {
          const user = new User({
            email: args.userInput.email,
            password: hashedPassword
          })
          return user.save()
        })
          .then(result => {
            return { ...result._doc, password: null }
          })
          .catch(err => {
            throw err
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