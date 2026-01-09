const { query } = require('./database/config');

async function showStatus() {
    try {
        console.log("=== DATABASE SYSTEM STATUS ===\n");

        // 1. Registered Students
        const students = await query("SELECT student_id, full_name, department FROM students");
        console.log(`[STUDENTS] Total: ${students.length}`);
        students.forEach(s => console.log(` - ${s.student_id}: ${s.full_name} (${s.department})`));

        // 2. Admins
        const admins = await query("SELECT admin_id, role, name FROM admin_registry");
        console.log(`\n[ADMINS] Total: ${admins.length}`);
        admins.forEach(a => console.log(` - ${a.admin_id} (${a.role}): ${a.name}`));

        // 3. Dorms & Blocks
        const rooms = await query("SELECT block_name, room_number, capacity, current_occupancy, status FROM dorm_rooms ORDER BY block_name, room_number");
        console.log(`\n[DORMS] Total Rooms: ${rooms.length}`);
        const blocks = [...new Set(rooms.map(r => r.block_name))];
        blocks.forEach(b => {
            const blockRooms = rooms.filter(r => r.block_name === b);
            console.log(` Block ${b}: ${blockRooms.length} rooms`);
            blockRooms.slice(0, 3).forEach(r => console.log(`   - Room ${r.room_number}: ${r.current_occupancy}/${r.capacity} (${r.status})`));
            if (blockRooms.length > 3) console.log(`   ... and ${blockRooms.length - 3} more`);
        });

        // 4. Applications & Rejection Reasons
        const apps = await query("SELECT application_id, student_id, status, admin_remark FROM applications");
        console.log(`\n[APPLICATIONS] Total: ${apps.length}`);
        const statusGroups = { 'Pending': 0, 'Verified': 0, 'Approved': 0, 'Rejected': 0 };
        apps.forEach(a => {
            statusGroups[a.status] = (statusGroups[a.status] || 0) + 1;
            if (a.status === 'Rejected') {
                console.log(` - ${a.student_id} REJECTED Reason: "${a.admin_remark}"`);
            }
        });
        console.log(` Summary: ${JSON.stringify(statusGroups)}`);

        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

showStatus();
