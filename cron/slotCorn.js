const cron = require("node-cron");
const DoctorSchema = require("../app/model/AdminModel");
const slotSchemaModel = require("../app/model/slotSchemaModel");

cron.schedule("0 0 * * *", async () => {
  console.log("Running slot cron...");

  try {
    const doctors = await DoctorSchema.find();

    let futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    let date = futureDate.toISOString().split("T")[0];

    for (let doctor of doctors) {
      const { startTime, endTime, slotDuration } = doctor.schedule;

      let start = new Date(`${date}T${startTime}:00`);
      let end = new Date(`${date}T${endTime}:00`);

      let slots = [];

      while (start < end) {
        slots.push({
          doctorId: doctor._id,
          date,
          time: start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isBooked: false,
        });

        start.setMinutes(start.getMinutes() + slotDuration);
      }

      if (slots.length === 0) continue;

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

    console.log(`Slots generated for ${date}`);
  } catch (err) {
    console.log("Cron error:", err.message);
  }
});
