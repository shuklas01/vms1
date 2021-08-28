const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const Pool = require('pg').Pool

const pool =new Pool({
  user: "vms_prod",
  password: "vms_prod",
  host: "localhost",
  port: "5432",
  database: "volunteermanagement"
} )

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const users = []
    //const hashedPassword1 = await bcrypt.hash(password, 10)
    users.push({
      id : Date.now().toString(),
      email: email,
      password: password
    })
    const user =  users.find(user => user.email === email)
    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }
    //const user = email
    console.log('In aythenticate method')
    console.log('Email:'+email)
    const sql = 'SELECT "Password" as password FROM vms.Volunteer WHERE "EmailAddress" = $1'
    var hashDbPwd = ''
    pool.query(sql , [email], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      if (result.rows.length>0)
      {
        console.log('password from db:' + result.rows[0].password)
        console.log('password from ui:' + password)
        hashDbPwd =  result.rows[0].password

      }
    });

    
     bcrypt.compare(password, hashDbPwd,(err,data)=> {
       console.log('inside bcrypt')
       if (err)
          {console.log(err)}
       if (data)
        {console.log('password matched')
        return done(null, user)}
       else {
        console.log('password not matched')
        return done(null, false, { message: 'Password incorrect' })
      }
    } );
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  //passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((id, done) => {
    return done(null, id => users.find(user => user.id === id))
  })
  
    

}

module.exports = initialize