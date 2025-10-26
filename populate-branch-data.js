const { supabaseAdmin } = require('./server/config/supabase');

async function populateBranchData() {
  try {
    console.log('🔄 Populating branch data for modal display...');
    
    // 1. Create additional stores
    console.log('📦 Creating additional stores...');
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name: 'Downtown Pharmacy',
          address: '456 Broadway Street',
          city: 'New York',
          state: 'NY',
          zip_code: '10002',
          phone: '+1-555-0201',
          email: 'downtown@pharmacy.com',
          is_active: true
        },
        {
          name: 'Westside Medical Store',
          address: '789 West Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90210',
          phone: '+1-555-0301',
          email: 'westside@pharmacy.com',
          is_active: true
        },
        {
          name: 'Central Health Pharmacy',
          address: '321 Central Plaza',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60601',
          phone: '+1-555-0401',
          email: 'central@pharmacy.com',
          is_active: true
        }
      ])
      .select();

    if (storesError) {
      console.error('❌ Error creating stores:', storesError);
    } else {
      console.log('✅ Stores created successfully');
    }

    // 2. Create additional users (managers for stores)
    console.log('👥 Creating store managers...');
    const { data: managers, error: managersError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: 'manager1@pharmacy.com',
          password_hash: '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S',
          first_name: 'Sarah',
          last_name: 'Johnson',
          role: 'manager',
          phone: '+1-555-0202',
          is_active: true
        },
        {
          email: 'manager2@pharmacy.com',
          password_hash: '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S',
          first_name: 'Michael',
          last_name: 'Brown',
          role: 'manager',
          phone: '+1-555-0302',
          is_active: true
        },
        {
          email: 'manager3@pharmacy.com',
          password_hash: '$2a$10$do/iizLT8QIyQFXEKf8MJOjZH.h2N1omXE3UHpxecrbqVDmUgS14S',
          first_name: 'Emily',
          last_name: 'Davis',
          role: 'manager',
          phone: '+1-555-0402',
          is_active: true
        }
      ])
      .select();

    if (managersError) {
      console.error('❌ Error creating managers:', managersError);
    } else {
      console.log('✅ Managers created successfully');
      
      // Update stores with manager IDs
      if (stores && managers) {
        for (let i = 0; i < Math.min(stores.length, managers.length); i++) {
          await supabaseAdmin
            .from('stores')
            .update({ manager_id: managers[i].id })
            .eq('id', stores[i].id);
        }
        console.log('✅ Store managers assigned');
      }
    }

    // 3. Create store inventory for each store
    console.log('📋 Creating store inventory...');
    const { data: medicines } = await supabaseAdmin
      .from('medicines')
      .select('id, name, price, quantity_in_stock')
      .limit(10);

    if (medicines && medicines.length > 0) {
      const allStores = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('is_active', true);

      if (allStores.data) {
        for (const store of allStores.data) {
          const inventoryItems = medicines.map(medicine => ({
            store_id: store.id,
            medicine_id: medicine.id,
            quantity: Math.floor(Math.random() * 50) + 10, // Random quantity 10-60
            minimum_stock_level: 10,
            maximum_stock_level: 100,
            last_restocked: new Date().toISOString()
          }));

          const { error: inventoryError } = await supabaseAdmin
            .from('store_inventory')
            .upsert(inventoryItems, { onConflict: 'store_id,medicine_id' });

          if (inventoryError) {
            console.error(`❌ Error creating inventory for store ${store.id}:`, inventoryError);
          }
        }
        console.log('✅ Store inventory created');
      }
    }

    // 4. Create orders for each store
    console.log('🛒 Creating orders for stores...');
    const { data: allStores } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('is_active', true);

    if (allStores) {
      for (const store of allStores) {
        const orders = [
          {
            order_number: `ORD-${store.id.slice(0, 8).toUpperCase()}-001`,
            customer_name: 'Alice Customer',
            customer_email: 'alice@example.com',
            customer_phone: '+1-555-1001',
            customer_address: '123 Customer Street',
            store_id: store.id,
            total_amount: 45.99,
            status: 'delivered',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
          },
          {
            order_number: `ORD-${store.id.slice(0, 8).toUpperCase()}-002`,
            customer_name: 'Bob Customer',
            customer_email: 'bob@example.com',
            customer_phone: '+1-555-1002',
            customer_address: '456 Customer Avenue',
            store_id: store.id,
            total_amount: 78.50,
            status: 'pending',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
          },
          {
            order_number: `ORD-${store.id.slice(0, 8).toUpperCase()}-003`,
            customer_name: 'Carol Customer',
            customer_email: 'carol@example.com',
            customer_phone: '+1-555-1003',
            customer_address: '789 Customer Road',
            store_id: store.id,
            total_amount: 32.75,
            status: 'shipped',
            created_at: new Date().toISOString() // Today
          }
        ];

        const { data: createdOrders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .insert(orders)
          .select();

        if (ordersError) {
          console.error(`❌ Error creating orders for store ${store.name}:`, ordersError);
        } else {
          console.log(`✅ Orders created for ${store.name}`);
        }
      }
    }

    // 5. Create billing records
    console.log('💰 Creating billing records...');
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total_amount, store_id')
      .limit(20);

    if (recentOrders) {
      const billingRecords = recentOrders.map(order => ({
        invoice_number: `INV-${order.order_number}`,
        order_id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        subtotal: order.total_amount * 0.9, // 10% discount
        tax_amount: order.total_amount * 0.08, // 8% tax
        discount_amount: order.total_amount * 0.1, // 10% discount
        total_amount: order.total_amount,
        payment_status: Math.random() > 0.3 ? 'paid' : 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));

      const { error: billingError } = await supabaseAdmin
        .from('billing')
        .upsert(billingRecords, { onConflict: 'invoice_number' });

      if (billingError) {
        console.error('❌ Error creating billing records:', billingError);
      } else {
        console.log('✅ Billing records created');
      }
    }

    // 6. Create some low stock medicines for alerts
    console.log('⚠️  Creating low stock alerts...');
    const { data: lowStockMedicines } = await supabaseAdmin
      .from('medicines')
      .select('id, name, quantity_in_stock')
      .lt('quantity_in_stock', 20)
      .limit(5);

    if (lowStockMedicines && lowStockMedicines.length > 0) {
      console.log(`✅ Found ${lowStockMedicines.length} low stock medicines for alerts`);
    }

    // 7. Create expiring medicines for alerts
    console.log('📅 Creating expiry alerts...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    
    const { data: expiringMedicines } = await supabaseAdmin
      .from('medicines')
      .select('id, name, expiry_date')
      .lt('expiry_date', futureDate.toISOString().split('T')[0])
      .limit(5);

    if (expiringMedicines && expiringMedicines.length > 0) {
      console.log(`✅ Found ${expiringMedicines.length} expiring medicines for alerts`);
    }

    // 8. Create notifications for stores
    console.log('🔔 Creating store notifications...');
    const { data: storeNotifications } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('is_active', true);

    if (storeNotifications) {
      const notifications = storeNotifications.flatMap(store => [
        {
          title: `Store Update: ${store.name}`,
          message: `Regular maintenance completed for ${store.name}`,
          type: 'info',
          is_read: false,
          data: { store_id: store.id, store_name: store.name }
        },
        {
          title: `Inventory Alert: ${store.name}`,
          message: `Low stock alert for ${store.name}`,
          type: 'warning',
          is_read: false,
          data: { store_id: store.id, store_name: store.name }
        }
      ]);

      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications);

      if (notificationsError) {
        console.error('❌ Error creating notifications:', notificationsError);
      } else {
        console.log('✅ Store notifications created');
      }
    }

    console.log('🎉 Branch data population complete!');
    console.log('\n📊 Summary:');
    console.log('- Multiple stores with managers');
    console.log('- Store inventory with realistic quantities');
    console.log('- Recent orders for each store');
    console.log('- Billing records with payment status');
    console.log('- Low stock and expiry alerts');
    console.log('- Store-specific notifications');
    console.log('\n✨ Your branch details modal should now display rich, realistic data!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

populateBranchData();
