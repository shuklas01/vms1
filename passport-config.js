const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const Pool = require('pg').Pool

const pool =new Pool({
  user: "postgres",
  password: "postgres",
  host: "volunteermanagement.cty2ahzz8pfv.us-west-2.rds.amazonaws.com",
  port: "5432",
  database: "volunteermanagement"
} )

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser =  ( email, password, done) => {
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

    //const sql = 'SELECT "Password" as password FROM vms.Volunteer WHERE "EmailAddress" = $1'
    const sql = 'SELECT "Password" as password FROM vms."volunteer" WHERE  "EmailAddress" = $1 UNION SELECT "Password" as "password" FROM vms."nonprofit_org" WHERE  "EmailAddress" = $1'
    //const sql = 'SELECT "Password" as password FROM vms."LoginInfo" as l inner join vms.Volunteer as v on l."UserId" = v."Id"  WHERE  "EmailAddress" = $1'
    pool.query(sql , [email], (err, result) => {
      if (err) {
        return console.error(err.message);
      }
      if (result.rows.length>0)
      {
        console.log('password from db:' + result.rows[0].password)
        console.log('password from ui:' + password)
        bcrypt.compare(password, result.rows[0].password,(err,isValid)=> {
          console.log('inside bcrypt')
          if (err)
             {console.log(err)}
          else if (isValid)
           {console.log('password matched')
           return done(null, user)}
          else {
           console.log('password not matched')
           return done(null, false, { message: 'Password incorrect' })
         }
       } 
       );

      }
    });

    //hashDbPwd.toString().replace(/^\$2y/, "$2a")
    console.log('test')
     /*bcrypt.compare(password, hashDbPwd,(err,data)=> {
       console.log('inside bcrypt')
       if (err)
          {console.log(err)}
       else if (data)
        {console.log('password matched')
        return done(null, user)}
       else {
        console.log('password not matched')
        return done(null, false, { message: 'Password incorrect' })
      }
    } 
    );*/
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) =>
  
   done(null, user.id))
  //passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((id, done) => {
    return done(null, id => users.find(user => user.id === id))
  })
  
    

}

module.exports = initialize