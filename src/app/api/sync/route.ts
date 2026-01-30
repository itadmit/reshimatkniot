import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';
import { cookies } from 'next/headers';

interface User {
  id: number;
}

// GET - Fetch all data for current family
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    // Verify access
    const user = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, user.id]
    );

    if (!membership) {
      return NextResponse.json({ error: 'אין גישה לקבוצה' }, { status: 403 });
    }

    // Fetch all data for this family
    const [categories, products, listItems, settings] = await Promise.all([
      query(
        'SELECT id, name, icon, color, sort_order as "sortOrder" FROM categories WHERE family_id = $1 ORDER BY sort_order',
        [currentFamilyId]
      ),
      query(
        `SELECT id, category_id as "categoryId", name, icon, unit, barcode, price, 
                image_url as "imageUrl", manufacturer, quantity, quantity_unit as "quantityUnit", 
                usage_count as "usageCount"
         FROM products WHERE family_id = $1`,
        [currentFamilyId]
      ),
      query(
        `SELECT li.id, li.product_id as "productId", li.qty, li.note, li.purchased, 
                li.updated_at as "updatedAt"
         FROM list_items li WHERE li.family_id = $1`,
        [currentFamilyId]
      ),
      queryOne(
        'SELECT dark_mode as "darkMode", whatsapp_number as "whatsappDefaultPhone" FROM family_settings WHERE family_id = $1',
        [currentFamilyId]
      )
    ]);

    return NextResponse.json({
      categories,
      products,
      listItems,
      settings: settings || { darkMode: false }
    });
  } catch (error) {
    console.error('Sync fetch error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת נתונים' }, { status: 500 });
  }
}

// POST - Sync data to family
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authPhone = cookieStore.get('auth_phone')?.value;
    const currentFamilyId = cookieStore.get('current_family')?.value;

    if (!authPhone || !currentFamilyId) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 });
    }

    const user = await queryOne<User>(
      'SELECT id FROM users WHERE phone = $1',
      [authPhone]
    );

    if (!user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });
    }

    const membership = await queryOne(
      'SELECT * FROM family_members WHERE family_id = $1 AND user_id = $2',
      [currentFamilyId, user.id]
    );

    if (!membership) {
      return NextResponse.json({ error: 'אין גישה לקבוצה' }, { status: 403 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'addCategory': {
        const [result] = await query(
          `INSERT INTO categories (family_id, name, icon, color, sort_order) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [currentFamilyId, data.name, data.icon, data.color, data.sortOrder || 0]
        );
        return NextResponse.json({ success: true, id: result.id });
      }

      case 'updateCategory': {
        await query(
          `UPDATE categories SET name = $1, icon = $2, color = $3, sort_order = $4 
           WHERE id = $5 AND family_id = $6`,
          [data.name, data.icon, data.color, data.sortOrder, data.id, currentFamilyId]
        );
        return NextResponse.json({ success: true });
      }

      case 'deleteCategory': {
        await query('DELETE FROM categories WHERE id = $1 AND family_id = $2', [data.id, currentFamilyId]);
        return NextResponse.json({ success: true });
      }

      case 'addProduct': {
        const [result] = await query(
          `INSERT INTO products (family_id, category_id, name, icon, unit, barcode, price, image_url, manufacturer, quantity, quantity_unit, usage_count) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [
            currentFamilyId, data.categoryId, data.name, data.icon, data.unit,
            data.barcode, data.price, data.imageUrl, data.manufacturer,
            data.quantity, data.quantityUnit, data.usageCount || 0
          ]
        );
        return NextResponse.json({ success: true, id: result.id });
      }

      case 'updateProduct': {
        await query(
          `UPDATE products SET category_id = $1, name = $2, icon = $3, unit = $4, 
           barcode = $5, price = $6, image_url = $7, manufacturer = $8, 
           quantity = $9, quantity_unit = $10, usage_count = $11
           WHERE id = $12 AND family_id = $13`,
          [
            data.categoryId, data.name, data.icon, data.unit,
            data.barcode, data.price, data.imageUrl, data.manufacturer,
            data.quantity, data.quantityUnit, data.usageCount,
            data.id, currentFamilyId
          ]
        );
        return NextResponse.json({ success: true });
      }

      case 'deleteProduct': {
        await query('DELETE FROM products WHERE id = $1 AND family_id = $2', [data.id, currentFamilyId]);
        return NextResponse.json({ success: true });
      }

      case 'addListItem': {
        const [result] = await query(
          `INSERT INTO list_items (family_id, product_id, qty, note, purchased, added_by, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
          [currentFamilyId, data.productId, data.qty, data.note, data.purchased || false, user.id]
        );
        return NextResponse.json({ success: true, id: result.id });
      }

      case 'updateListItem': {
        await query(
          `UPDATE list_items SET qty = $1, note = $2, purchased = $3, updated_at = NOW() 
           WHERE id = $4 AND family_id = $5`,
          [data.qty, data.note, data.purchased, data.id, currentFamilyId]
        );
        return NextResponse.json({ success: true });
      }

      case 'deleteListItem': {
        await query('DELETE FROM list_items WHERE id = $1 AND family_id = $2', [data.id, currentFamilyId]);
        return NextResponse.json({ success: true });
      }

      case 'clearList': {
        await query('DELETE FROM list_items WHERE family_id = $1', [currentFamilyId]);
        return NextResponse.json({ success: true });
      }

      case 'clearAllData': {
        // Delete in correct order due to foreign keys
        await query('DELETE FROM list_items WHERE family_id = $1', [currentFamilyId]);
        await query('DELETE FROM products WHERE family_id = $1', [currentFamilyId]);
        await query('DELETE FROM categories WHERE family_id = $1', [currentFamilyId]);
        return NextResponse.json({ success: true });
      }

      case 'updateSettings': {
        await query(
          `INSERT INTO family_settings (family_id, dark_mode, whatsapp_number) 
           VALUES ($1, $2, $3)
           ON CONFLICT (family_id) DO UPDATE SET dark_mode = $2, whatsapp_number = $3`,
          [currentFamilyId, data.darkMode, data.whatsappDefaultPhone]
        );
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'פעולה לא ידועה' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync action error:', error);
    return NextResponse.json({ error: 'שגיאה בסנכרון' }, { status: 500 });
  }
}

