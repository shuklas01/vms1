if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const passport = require('passport')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  const {Client} = require('pg')
  
  const initializePassport = require('./passport-config')
  initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
  )
  
  const users = []

 /*const client =new Client({
        user: "postgres",
        password: "myPassword",
        host: "localhost",
        port: "5432",
        database: "volunteermanagement"
  } )*/

  
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  
  app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
  })
  
  app.get('/volunteer-login', checkNotAuthenticated, (req, res) => {
    res.render('volunteer-login.ejs')
  })
  
  app.post('/volunteer-login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/volunteer-login',
    failureFlash: true
  }))
  
  app.get('/volunteer-signup', checkNotAuthenticated, (req, res) => {
    res.render('volunteer-signup.ejs')
    /*client.connect()
  .then(() => alert("Connected successfully"))
  .catch(e => console.log(e))
  .finally(() => client.end())  */
  })
  
  app.post('/volunteer-signup', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      users.push({
        id: Date.now().toString(),
        name: req.body.firstname,
        email: req.body.email,
        password: hashedPassword
      })
      res.redirect('/volunteer-login')
    } catch {
      res.redirect('/volunteer-signup')
    }
  })
  
  app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/volunteer-login')
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/volunteer-login')
  }

  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }
  
  app.listen(3000)