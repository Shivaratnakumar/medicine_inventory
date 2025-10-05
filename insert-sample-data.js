const { supabaseAdmin } = require('./server/config/supabase');

async function insertSampleData() {
  try {
    console.log('🔄 Inserting sample data...');
    
    // Check if we have medicines
    const { data: medicines, error: medError } = await supabaseAdmin
      .from('medicines')
      .select('id, name, price')
      .limit(5);
    
    if (medError) {
      console.error('❌ Error fetching medicines:', medError);
      return;
    }
    
    if (medicines.length === 0) {
      console.log('⚠️  No medicines found. Please run the database/schema.sql first.');
      return;
    }
    
    console.log('📦 Found medicines:', medicines.length);
    
    // Check if orders already exist
    const { data: existingOrders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1);
    
    if (existingOrders && existingOrders.length > 0) {
      console.log('✅ Sample orders already exist');
      return;
    }
    
    // Insert sample orders
    const { data: orders, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          order_number: 'ORD001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+1-555-0101',
          total_amount: 45.97,
          status: 'delivered'
        },
        {
          order_number: 'ORD002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          customer_phone: '+1-555-0102',
          total_amount: 28.98,
          status: 'pending'
        },
        {
          order_number: 'ORD003',
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          customer_phone: '+1-555-0103',
          total_amount: 67.95,
          status: 'shipped'
        }
      ])
      .select();
    
    if (orderError) {
      console.error('❌ Error inserting orders:', orderError);
      return;
    }
    
    console.log('✅ Orders inserted successfully');
    
    // Insert sample order items
    const orderItems = [];
    orders.forEach((order, index) => {
      const medicine = medicines[index % medicines.length];
      orderItems.push({
        order_id: order.id,
        medicine_id: medicine.id,
        quantity: 2,
        unit_price: medicine.price,
        total_price: medicine.price * 2
      });
    });
    
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('❌ Error inserting order items:', itemsError);
      return;
    }
    
    console.log('✅ Order items inserted successfully');
    console.log('🎉 Sample data setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

insertSampleData();

