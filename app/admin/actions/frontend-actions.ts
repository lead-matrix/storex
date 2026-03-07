"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Ensure caller is an authenticated admin
async function ensureAdmin() {
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const supabase = await createAdminClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Unauthorized');
    return supabase;
}

// =====================================================
// FRONTEND CONTENT ACTIONS
// =====================================================

export async function updateFrontendContent(
    contentKey: string,
    contentData: Record<string, unknown>
) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("frontend_content")
        .update({
            content_data: contentData,
            updated_at: new Date().toISOString(),
        })
        .eq("content_key", contentKey)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function getFrontendContent(contentKey: string) {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("frontend_content")
        .select("*")
        .eq("content_key", contentKey)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function getAllFrontendContent() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("frontend_content")
        .select("*")
        .order("content_type");

    if (error) {
        return [];
    }

    return data;
}

export async function createFrontendContent(
    contentKey: string,
    contentType: string,
    contentData: Record<string, unknown>
) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("frontend_content")
        .insert({
            content_key: contentKey,
            content_type: contentType,
            content_data: contentData,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function deleteFrontendContent(contentKey: string) {
    const supabase = await ensureAdmin();

    const { error } = await supabase
        .from("frontend_content")
        .delete()
        .eq("content_key", contentKey);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true };
}

// =====================================================
// NAVIGATION MENU ACTIONS
// =====================================================

export async function updateNavigationMenu(menuKey: string, menuItems: Record<string, unknown>[]) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("navigation_menus")
        .update({
            menu_items: menuItems,
            updated_at: new Date().toISOString(),
        })
        .eq("menu_key", menuKey)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function getNavigationMenu(menuKey: string) {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("navigation_menus")
        .select("*")
        .eq("menu_key", menuKey)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function getAllNavigationMenus() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("navigation_menus")
        .select("*")
        .order("display_order");

    if (error) {
        return [];
    }

    return data;
}

// =====================================================
// PAGE CONTENT ACTIONS
// =====================================================

export async function updatePage(slug: string, pageData: Record<string, unknown>) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("pages")
        .update({
            ...pageData,
            updated_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath(`/${slug}`);
    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function getPage(slug: string) {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function getAllPages() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return [];
    }

    return data;
}

export async function createPage(pageData: Record<string, unknown>) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("pages")
        .insert(pageData)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function deletePage(slug: string) {
    const supabase = await ensureAdmin();

    const { error } = await supabase.from("pages").delete().eq("slug", slug);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true };
}

// =====================================================
// THEME SETTINGS ACTIONS
// =====================================================

export async function updateThemeSettings(themeKey: string, settings: Record<string, unknown>) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("theme_settings")
        .update({
            ...settings,
            updated_at: new Date().toISOString(),
        })
        .eq("theme_key", themeKey)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function getActiveTheme() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_active", true)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function getAllThemes() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return [];
    }

    return data;
}

export async function activateTheme(themeKey: string) {
    const supabase = await ensureAdmin();

    // Deactivate all themes
    await supabase.from("theme_settings").update({ is_active: false }).neq("theme_key", "");

    // Activate the selected theme
    const { data, error } = await supabase
        .from("theme_settings")
        .update({ is_active: true })
        .eq("theme_key", themeKey)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

// =====================================================
// SITE SETTINGS ACTIONS (Enhanced)
// =====================================================

export async function updateSiteSettings(settingKey: string, settingValue: Record<string, unknown>) {
    const supabase = await ensureAdmin();

    const { data, error } = await supabase
        .from("site_settings")
        .update({
            setting_value: settingValue,
            updated_at: new Date().toISOString(),
        })
        .eq("setting_key", settingKey)
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");

    return { success: true, data };
}

export async function getSiteSettings(settingKey: string) {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", settingKey)
        .single();

    if (error) {
        return null;
    }

    return data;
}

export async function getAllSiteSettings() {
    // Read-only: use anon client
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("setting_key");

    if (error) {
        return [];
    }

    return data;
}

