const express = require('express');
const app = express();
const PORT = 4000;
//importing studetn routes
const studentRoutes = require('./routes/student');
// importing route for the SAG bureau
const SAGRoutes = require('./routes/SAG');
// importing route for the Fincace Bureau
const FinanceRoutes = require('./routes/Finance');
// including admin routes
const AdminRoutes = require('./routes/admin');

// for parsing json data
app.use(express.json());

// including the student routes
app.use('/api/students',studentRoutes);

// including the SAG routes 
app.use('/api/SAG',SAGRoutes)

// including the fincace routes
app.use('/api/finance',FinanceRoutes);
// including admin routes
app.use('/api/admin',AdminRoutes);

// route to test the server
app.get('/',(req,res)=>{
    res.send('scholarship backend is running!');

});

// starting the server
app.listen(PORT,()=>{
     console.log(`Server is started on the port ${PORT}`);
     
})