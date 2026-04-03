-- =============================================
-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'junior');

CREATE TYPE public.estado_proceso AS ENUM (
  'Research', 'Reunión Cliente', 'Entrevista Consultor', 
  'Entrevista Cliente', 'Evaluación Psicológica', 
  'Chequeo Referencias', 'Carta Oferta', 'Terminado'
);

CREATE TYPE public.status_postulante AS ENUM (
  'Llamar - Pendiente Contacto', 'No responde al perfil', 'Perfila',
  'No interesado', 'Plan B', 'Excede Renta',
  'CO Entregada', 'CO Aceptada', 'CO Rechazada', 'Placed'
);

CREATE TYPE public.tipo_contrato AS ENUM (
  'Indefinido Fulltime - Presencial', 'Indefinido Fulltime - Híbrido',
  'Indefinido Fulltime - Remoto', 'Contrato a Plazo por Proyecto',
  'Contrato a Plazo por Reemplazo', 'Part-time',
  'Práctica Profesional / Pasantía'
);

CREATE TYPE public.genero AS ENUM ('Masculino', 'Femenino', 'Otro', 'Prefiero no decir');

CREATE TYPE public.industria AS ENUM (
  'Agroindustria', 'Asesoría y Servicios jurídicos', 'Bienes de consumo',
  'Cadena logística y de suministro', 'Compañías aéreas', 'Construcción',
  'Consultoría', 'Educación', 'Energía', 'Entrenamiento, viajes y turismo',
  'Fabricación y producción', 'Gobierno, gestión pública o servicios públicos',
  'Medios de comunicación, publicidad y marketing', 'Minería',
  'Retail, ventas minoristas y mayoristas', 'Salud', 'Sector farmaceútico',
  'Servicios financieros', 'Servicios generales o industriales',
  'Servicios profesionales', 'Tecnología', 'Telecomunicaciones'
);


-- =============================================
-- 2. HELPER FUNCTIONS (update_updated_at_column, has_role, generate_sharing_code)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_sharing_code()
RETURNS VARCHAR AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..5 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- 3. TABLES (all columns inline, RLS enabled)
--    Order: profiles -> user_roles -> clientes -> procesos -> perfiles_cargo -> postulantes -> user_client_assignments -> observaciones_research
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  rut TEXT,
  industria industria,
  pais TEXT DEFAULT 'Chile',
  ciudad TEXT DEFAULT 'Santiago',
  personas_contacto TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.procesos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_cargo TEXT NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  tipo_contrato tipo_contrato,
  mision_cargo TEXT,
  estado estado_proceso NOT NULL DEFAULT 'Research',
  mision TEXT,
  perfil TEXT,
  renta_obj INTEGER,
  sharing_token UUID DEFAULT gen_random_uuid(),
  sharing_code VARCHAR(5),
  renta_var_def BIGINT DEFAULT 0,
  benef_def TEXT,
  carta_gantt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.procesos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.perfiles_cargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_id UUID REFERENCES public.procesos(id) ON DELETE CASCADE NOT NULL,
  descripcion TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.perfiles_cargo ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.postulantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_id UUID REFERENCES public.procesos(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  status status_postulante NOT NULL DEFAULT 'Llamar - Pendiente Contacto',
  telefono TEXT,
  email TEXT,
  linkedin TEXT,
  cargo_actual TEXT,
  empresa TEXT,
  edad INT,
  genero genero,
  estudios TEXT,
  institucion TEXT,
  estudios_2 TEXT,
  institucion_2 TEXT,
  estudios_3 TEXT,
  institucion_3 TEXT,
  renta_actual BIGINT,
  pretension_renta BIGINT,
  observaciones TEXT,
  benef_act TEXT,
  estado_proceso_postulante estado_proceso DEFAULT 'Research',
  motivacion TEXT,
  cv_url TEXT,
  foto_url TEXT,
  cargo_2 TEXT,
  empresa_2 TEXT,
  fecha_inicio_1 TEXT,
  fecha_fin_1 TEXT,
  fecha_inicio_2 TEXT,
  fecha_fin_2 TEXT,
  cargo_3 TEXT,
  empresa_3 TEXT,
  fecha_inicio_3 TEXT,
  fecha_fin_3 TEXT,
  cargo_4 TEXT,
  empresa_4 TEXT,
  fecha_inicio_4 TEXT,
  fecha_fin_4 TEXT,
  cargo_5 TEXT,
  empresa_5 TEXT,
  fecha_inicio_5 TEXT,
  fecha_fin_5 TEXT,
  cargo_6 TEXT,
  empresa_6 TEXT,
  fecha_inicio_6 TEXT,
  fecha_fin_6 TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.postulantes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, cliente_id)
);
ALTER TABLE public.user_client_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.observaciones_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceso_id UUID NOT NULL REFERENCES public.procesos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('no_interesado', 'no_responde_perfil')),
  descripcion TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.observaciones_research ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- 4. TRIGGERS (updated_at triggers + ensure_sharing_code)
-- =============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procesos_updated_at
  BEFORE UPDATE ON public.procesos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postulantes_updated_at
  BEFORE UPDATE ON public.postulantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.trg_assign_sharing_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sharing_code IS NULL THEN
    NEW.sharing_code := public.generate_sharing_code();
  END IF;
  IF NEW.sharing_token IS NULL THEN
    NEW.sharing_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_sharing_code
  BEFORE INSERT ON public.procesos
  FOR EACH ROW EXECUTE FUNCTION public.trg_assign_sharing_code();


-- =============================================
-- 5. RLS POLICIES (grouped by table)
-- =============================================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- clientes
CREATE POLICY "Authenticated can view clientes" ON public.clientes FOR SELECT TO authenticated
  USING ((EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR deleted_at IS NULL);
CREATE POLICY "Authenticated can insert clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update clientes" ON public.clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete clientes" ON public.clientes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- procesos
CREATE POLICY "Authenticated can view procesos" ON public.procesos FOR SELECT TO authenticated
  USING ((EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR deleted_at IS NULL);
CREATE POLICY "Authenticated can insert procesos" ON public.procesos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update procesos" ON public.procesos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete procesos" ON public.procesos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- perfiles_cargo
CREATE POLICY "Authenticated can view perfiles_cargo" ON public.perfiles_cargo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert perfiles_cargo" ON public.perfiles_cargo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update perfiles_cargo" ON public.perfiles_cargo FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete perfiles_cargo" ON public.perfiles_cargo FOR DELETE TO authenticated USING (true);

-- postulantes
CREATE POLICY "Authenticated can view postulantes" ON public.postulantes FOR SELECT TO authenticated
  USING ((EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')) OR deleted_at IS NULL);
CREATE POLICY "Authenticated can insert postulantes" ON public.postulantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update postulantes" ON public.postulantes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete postulantes" ON public.postulantes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_client_assignments
CREATE POLICY "Authenticated users can view assignments" ON public.user_client_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assignments" ON public.user_client_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- observaciones_research
CREATE POLICY "Users can view all observaciones_research" ON public.observaciones_research FOR SELECT USING (true);
CREATE POLICY "Users can insert observaciones_research" ON public.observaciones_research FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update observaciones_research" ON public.observaciones_research FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete observaciones_research" ON public.observaciones_research FOR DELETE USING (auth.role() = 'authenticated');


-- =============================================
-- 6. APPLICATION FUNCTIONS (handle_new_user, get_public_report_data, soft_delete_*, restore_*, delete_user)
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- First user gets admin role
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    -- Set role from metadata provided by Admin during registration or default to junior
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      assigned_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
    ELSE
      assigned_role := 'junior'::public.app_role;
    END IF;
    
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  END IF;
  
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_public_report_data(p_token UUID, p_code VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proceso RECORD;
    v_cliente RECORD;
    v_perfiles JSON;
    v_postulantes JSON;
    v_observaciones JSON;
    v_result JSON;
BEGIN
    -- Verify token and code
    SELECT p.id, p.nombre_cargo, p.estado, p.mision_cargo, p.cliente_id, p.renta_obj 
    INTO v_proceso
    FROM public.procesos p
    WHERE p.sharing_token = p_token AND p.sharing_code = p_code;

    IF NOT FOUND THEN
        RETURN NULL; -- Or throw exception
    END IF;

    -- Get client data
    SELECT c.nombre, c.logo_url
    INTO v_cliente
    FROM public.clientes c
    WHERE c.id = v_proceso.cliente_id;

    -- Get perfiles
    SELECT COALESCE(json_agg(row_to_json(pc)), '[]'::json)
    INTO v_perfiles
    FROM (
        SELECT id, descripcion, orden 
        FROM public.perfiles_cargo 
        WHERE proceso_id = v_proceso.id 
        ORDER BY orden
    ) pc;

    -- Get postulantes
    SELECT COALESCE(json_agg(row_to_json(pos)), '[]'::json)
    INTO v_postulantes
    FROM (
        SELECT *
        FROM public.postulantes
        WHERE proceso_id = v_proceso.id
        ORDER BY created_at DESC
    ) pos;

    -- Get observaciones
    SELECT COALESCE(json_agg(row_to_json(obs)), '[]'::json)
    INTO v_observaciones
    FROM (
        SELECT *
        FROM public.observaciones_research
        WHERE proceso_id = v_proceso.id
        ORDER BY tipo, orden
    ) obs;

    -- Construct final JSON
    v_result := json_build_object(
        'proceso', row_to_json(v_proceso),
        'cliente', row_to_json(v_cliente),
        'perfiles_cargo', v_perfiles,
        'postulantes', v_postulantes,
        'observaciones_research', v_observaciones
    );

    RETURN v_result;
END;
$$;


CREATE OR REPLACE FUNCTION public.soft_delete_postulante(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.postulantes SET deleted_at = now() WHERE id = p_id AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_proceso(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.procesos SET deleted_at = now() WHERE id = p_id AND deleted_at IS NULL;
  UPDATE public.postulantes SET deleted_at = now() WHERE proceso_id = p_id AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_cliente(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes SET deleted_at = now() WHERE id = p_id AND deleted_at IS NULL;
  -- Cascade to all procesos of this client
  UPDATE public.postulantes SET deleted_at = now()
    WHERE proceso_id IN (SELECT id FROM public.procesos WHERE cliente_id = p_id)
    AND deleted_at IS NULL;
  UPDATE public.procesos SET deleted_at = now() WHERE cliente_id = p_id AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_postulante(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.postulantes SET deleted_at = NULL WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_proceso(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.procesos SET deleted_at = NULL WHERE id = p_id;
  UPDATE public.postulantes SET deleted_at = NULL WHERE proceso_id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_cliente(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes SET deleted_at = NULL WHERE id = p_id;
  -- Cascade to all procesos of this client
  UPDATE public.procesos SET deleted_at = NULL WHERE cliente_id = p_id;
  UPDATE public.postulantes SET deleted_at = NULL
    WHERE proceso_id IN (SELECT id FROM public.procesos WHERE cliente_id = p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden eliminar usuarios del sistema.';
  END IF;

  -- 2. Prevent deleting yourself
  IF auth.uid() = p_user_id THEN
    RAISE EXCEPTION 'No puedes eliminarte a ti mismo.';
  END IF;

  -- 3. Nullify created_by in other tables to avoid foreign key violations
  UPDATE public.clientes SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.procesos SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE public.postulantes SET created_by = NULL WHERE created_by = p_user_id;

  -- 4. Eliminate user_client_assignments for this user
  DELETE FROM public.user_client_assignments WHERE user_id = p_user_id;

  -- 5. Delete from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


-- =============================================
-- 7. AUTH TRIGGER (on_auth_user_created)
-- =============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================
-- 8. GRANT STATEMENTS
-- =============================================

GRANT EXECUTE ON FUNCTION public.soft_delete_postulante(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_proceso(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_cliente(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_postulante(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_proceso(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_cliente(UUID) TO authenticated;


-- =============================================
-- 9. STORAGE BUCKETS + STORAGE POLICIES
-- =============================================

-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-logos', 'client-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cartas_gantt', 'cartas_gantt', true) ON CONFLICT (id) DO NOTHING;

-- cvs policies
CREATE POLICY "Authenticated users can upload CVs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cvs');
CREATE POLICY "Authenticated users can view CVs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cvs');
CREATE POLICY "Authenticated users can update CVs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cvs');
CREATE POLICY "Authenticated users can delete CVs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cvs');
CREATE POLICY "Public can view CVs" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'cvs');

-- fotos policies
CREATE POLICY "Authenticated users can upload fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "Public users can view fotos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fotos');
CREATE POLICY "Authenticated users can update fotos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos');
CREATE POLICY "Authenticated users can delete fotos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos');

-- client-logos policies
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-logos');
CREATE POLICY "Public can view logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'client-logos');
CREATE POLICY "Authenticated users can manage logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'client-logos');
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'client-logos');

-- cartas_gantt policies
CREATE POLICY "Carta Gantt Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'cartas_gantt');
CREATE POLICY "Authenticated users can upload Carta Gantt" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cartas_gantt');
CREATE POLICY "Users can update their own Carta Gantt" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cartas_gantt');
CREATE POLICY "Users can delete their own Carta Gantt" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cartas_gantt');
