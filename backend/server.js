const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const patients = [
{
id:1,
name:"Aarav Sharma",
age:8,
bloodGroup:"O+",
room:"101",
diagnosis:"Epilepsy",
status:"Stable",
doctor:"Dr. Rajesh Mehta",
contact:"9876543210",
history:"Frequent seizure monitoring"
},
{
id:2,
name:"Priya Nair",
age:29,
bloodGroup:"A+",
room:"105",
diagnosis:"Post Surgery",
status:"Critical",
doctor:"Dr. Anitha Rao",
contact:"9876543211",
history:"Recovering from abdominal surgery"
},
{
id:3,
name:"Rohan Verma",
age:17,
bloodGroup:"B+",
room:"108",
diagnosis:"Head Trauma",
status:"Observation",
doctor:"Dr. Vivek Kumar",
contact:"9876543212",
history:"Neurological supervision"
},
{
id:4,
name:"Ananya Iyer",
age:45,
bloodGroup:"AB+",
room:"110",
diagnosis:"Stroke",
status:"Critical",
doctor:"Dr. Kumar",
contact:"9876543213",
history:"Post stroke rehabilitation"
},
{
id:5,
name:"Vikram Singh",
age:61,
bloodGroup:"O-",
room:"112",
diagnosis:"Heart Disease",
status:"Stable",
doctor:"Dr. Ravi",
contact:"9876543214",
history:"Cardiac monitoring"
},
{
id:6,
name:"Meera Joseph",
age:34,
bloodGroup:"A-",
room:"115",
diagnosis:"Diabetes",
status:"Stable",
doctor:"Dr. Priya",
contact:"9876543215",
history:"Insulin observation"
},
{
id:7,
name:"Arjun Menon",
age:52,
bloodGroup:"B-",
room:"118",
diagnosis:"Hypertension",
status:"Observation",
doctor:"Dr. Karthik",
contact:"9876543216",
history:"Blood pressure tracking"
},
{
id:8,
name:"Sneha Patel",
age:23,
bloodGroup:"AB-",
room:"120",
diagnosis:"Fracture",
status:"Stable",
doctor:"Dr. Ajay",
contact:"9876543217",
history:"Orthopedic care"
},
{
id:9,
name:"Rahul Gupta",
age:70,
bloodGroup:"O+",
room:"122",
diagnosis:"Parkinson's",
status:"Observation",
doctor:"Dr. Nitin",
contact:"9876543218",
history:"Movement disorder monitoring"
},
{
id:10,
name:"Lakshmi Devi",
age:81,
bloodGroup:"A+",
room:"125",
diagnosis:"Dementia",
status:"Critical",
doctor:"Dr. Shalini",
contact:"9876543219",
history:"Memory care supervision"
}
];

app.get("/patients", (req, res) => {
res.json(patients);
});

app.listen(5000, () => {
console.log("Backend running on http://localhost:5000");
});
