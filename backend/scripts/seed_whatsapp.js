const mongoose = require('mongoose');
const env = require('../src/config/env');

const Template = require('../src/models/Template');
const Settings = require('../src/models/Settings');
const Poster = require('../src/models/Poster');
const Student = require('../src/models/Student');
const Membership = require('../src/models/Membership');
const Plan = require('../src/models/Plan');
const Attendance = require('../src/models/Attendance');
const moment = require('moment');

// The Gen-Z Meme Style Templates
const templatesData = [
  {
    type: 'welcome',
    body: `Yooo {{student_name}}! 🎉 Welcome to {{studio_name}}! \n\nYour vibe just leveled up. You're officially enrolled in the {{plan_name}} plan.\nStarts: {{membership_start}}\nEnds: {{membership_end}}\n\nGet ready to slay on the dance floor! 🔥 Let's get it! 💪`
  },
  {
    type: 'miss_you_1',
    body: `Hey {{student_name}}! 🥺\n\nNgl, the studio is kinda boring without you. You've been MIA for 5 days! 😱 \nCome back and show us those moves! We miss your energy! ✨`,
    variations: [
      `Hey {{student_name}}! 🥺\n\nNgl, the studio is kinda boring without you. You've been MIA for 5 days! 😱 \nCome back and show us those moves! We miss your energy! ✨`,
      `Yo {{student_name}}! 🕵️‍♂️\n\nIt's been 5 days and the dance floor feels empty! Where you at? Drop in today and let's vibe! 🎶💃`,
      `Missing our star dancer! 🌟\n\n{{student_name}}, 5 days away is too long. Grab your dancing shoes and come see us! 👟🔥`
    ]
  },
  {
    type: 'miss_you_2',
    body: `Bro, {{student_name}}... 💀\n\n10 days? Are you ghosting us? 👻 We're out here dancing and you're missing all the fun. \nDrop everything and come to class today! 💃🕺`,
    variations: [
      `Bro, {{student_name}}... 💀\n\n10 days? Are you ghosting us? 👻 We're out here dancing and you're missing all the fun. \nDrop everything and come to class today! 💃🕺`,
      `{{student_name}}! 🚨 10 whole days without you!\n\nThe music isn't the same. Stop ghosting and get back to the studio! We need your energy! 💥`,
      `Did you forget the choreo, {{student_name}}? 😂\n\nIt's been 10 days! Time to shake off the rust and hit the floor with us today! 💯`
    ]
  },
  {
    type: 'miss_you_3',
    body: `Code Red, {{student_name}}! 🚨\n\nIt's been 15 days! The dance floor is literally crying. 😭 \nIf you don't show up soon, we're sending a search party! 🕵️ Come back bestie! 💖`,
    variations: [
      `Code Red, {{student_name}}! 🚨\n\nIt's been 15 days! The dance floor is literally crying. 😭 \nIf you don't show up soon, we're sending a search party! 🕵️ Come back bestie! 💖`,
      `We're officially sending out a search party for {{student_name}}! 🚁🔍\n\n15 days away is unacceptable! You're missing too much fun. Come back ASAP! ✨`,
      `{{student_name}}, is everything okay? 🥺\n\nWe haven't seen you in 15 days! Let's get you back in the groove. Drop in for a session, it'll make you feel amazing! 💪🎶`
    ]
  },
  {
    type: 'expiry_5',
    body: `Heads up {{student_name}}! 👀\n\nYour {{plan_name}} membership is expiring in 5 days! ⏳ Don't let the vibe die. \nRenew now and let's keep dancing! 🚀`
  },
  {
    type: 'expiry_3',
    body: `Tick tock, {{student_name}}! ⏰\n\nOnly 3 days left on your membership! You're too fire to stop now. 🔥 \nHit up the front desk to renew! 💸`
  },
  {
    type: 'expiry_2',
    body: `🚨 2 DAYS LEFT {{student_name}} 🚨\n\nDon't fumble the bag! Renew your membership before it's gone. 🏃💨`
  },
  {
    type: 'expiry_1',
    body: `OMG {{student_name}}! 😱\n\nTomorrow is your last day! 😭 Renew your membership right now so the party doesn't stop! 🎉`
  },
  {
    type: 'expiry_0',
    body: `RIP your membership, {{student_name}} 🪦🥀\n\nIt officially expired today. But it's not over yet! Come back and renew so we can keep slaying together! ✨👑`
  },
  {
    type: 'renewal',
    body: `W in the chat! 🏆\n\n{{student_name}}, your {{plan_name}} membership has been renewed! \nValid until: {{membership_end}} \n\nLet's get back to the grind! 💯🔥`
  }
];

const postersData = [
  { category: 'welcome', imageUrl: 'https://dummyimage.com/600x800/000000/FFFFFF&text=Welcome+to+the+Studio' },
  { category: 'miss_you', imageUrl: 'https://dummyimage.com/600x800/FF0000/FFFFFF&text=We+Miss+You!+Come+Back' },
  { category: 'miss_you', imageUrl: 'https://dummyimage.com/600x800/FF0000/FFFFFF&text=Where+Are+You+Bestie%3F' },
  { category: 'miss_you', imageUrl: 'https://dummyimage.com/600x800/FF0000/FFFFFF&text=Studio+is+Empty+Without+You' },
  { category: 'expiry', imageUrl: 'https://dummyimage.com/600x800/FFA500/000000&text=Membership+Expiring+Soon' },
  { category: 'expiry', imageUrl: 'https://dummyimage.com/600x800/FFA500/000000&text=Dont+Let+The+Music+Stop' },
  { category: 'renewal', imageUrl: 'https://dummyimage.com/600x800/008000/FFFFFF&text=Membership+Renewed!' }
];

const runSeed = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');

    // 1. Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({});
      console.log('✅ Settings created');
    } else {
      console.log('⚡ Settings already exist');
    }

    // 2. Seed Templates
    for (const t of templatesData) {
      await Template.findOneAndUpdate(
        { type: t.type },
        { body: t.body, variations: t.variations || [], isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Gen-Z Templates seeded');

    // 3. Seed Posters
    await Poster.deleteMany({});
    await Poster.insertMany(postersData);
    console.log('✅ Placeholder Posters seeded');

    // 4. Create dummy data for Cron Job testing
    console.log('Creating dummy data for cron testing...');
    
    // Clear old test data if needed (optional)
    await Student.deleteMany({ fullName: { $regex: 'Test Student' } });
    
    let plan = await Plan.findOne();
    if (!plan) {
       console.log('No plans found, creating a default plan...');
       plan = await Plan.create({
         name: 'Monthly Pro Plan',
         price: 1999,
         durationDays: 30,
         benefits: ['All classes', 'Free locker']
       });
    }

    // Create 3 students for Inactivity testing
    for (let i = 1; i <= 3; i++) {
        const student = await Student.create({
            fullName: `Test Student Absent ${i*5} Days`,
            mobile: `9009149694`,
            whatsappNumber: `9009149694`,
            status: 'active',
            planId: plan._id
        });

        await Membership.create({
            studentId: student._id,
            planId: plan._id,
            startDate: moment().subtract(1, 'month').toDate(),
            endDate: moment().add(1, 'month').toDate(),
            status: 'active'
        });

        // Add 1 present day right before the absence period
        await Attendance.create({
            studentId: student._id,
            date: moment().subtract(i*5 + 1, 'days').toDate(),
            status: 'present'
        });
        
        // Add absent days
        for(let j=0; j < i*5; j++) {
             await Attendance.create({
                studentId: student._id,
                date: moment().subtract(j, 'days').toDate(),
                status: 'absent'
            });
        }
    }
    
    // Create students for Expiry testing
    const expiryDays = [5, 3, 2, 1, 0];
    for (let i = 0; i < expiryDays.length; i++) {
        const student = await Student.create({
            fullName: `Test Student Expiring in ${expiryDays[i]} Days`,
            mobile: `9009149694`,
            whatsappNumber: `9009149694`,
            status: 'active',
            planId: plan._id
        });

        await Membership.create({
            studentId: student._id,
            planId: plan._id,
            startDate: moment().subtract(1, 'month').toDate(),
            endDate: moment().add(expiryDays[i], 'days').toDate(),
            status: 'active'
        });

        // Add a recent attendance record so they aren't flagged as inactive for 15 days!
        await Attendance.create({
            studentId: student._id,
            date: moment().subtract(1, 'days').toDate(),
            status: 'present'
        });
    }

    console.log('✅ Dummy students, memberships and attendance records created.');
    console.log('You can now run the cron jobs or hit test endpoints to verify.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

runSeed();
