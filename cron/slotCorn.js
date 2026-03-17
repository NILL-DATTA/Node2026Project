const cron = require("node-cron");
const DoctorSchema = require("../app/model/AdminModel");
const slotSchemaModel = require("../app/model/slotSchemaModel");

cron.schedule("0 0 * * *", async () => {
  console.log("Running slot cron...");

  try {
    const doctors = await DoctorSchema.find();

    for (let i = 0; i < 7; i++) {
      let futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);

      let date = futureDate.toISOString().split("T")[0];

      for (let doctor of doctors) {
        const { startTime, endTime, slotDuration } = doctor.schedule;

        let start = new Date(`${date}T${startTime}:00`);
        let end = new Date(`${date}T${endTime}:00`);

        let slots = [];

        while (start <= end) {
          slots.push({
            doctorId: doctor._id,
            date,
            time: start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });

          start.setMinutes(start.getMinutes() + slotDuration);
        }

        const bulkOps = slots.map((slot) => ({
          updateOne: {
            filter: {
              doctorId: slot.doctorId,
              date: slot.date,
              time: slot.time,
            },
            update: { $setOnInsert: slot },
            upsert: true,
          },
        }));

        await slotSchemaModel.bulkWrite(bulkOps);
      }
    }

    console.log("Slots generated");
  } catch (err) {
    console.log(err.message);
  }
});
