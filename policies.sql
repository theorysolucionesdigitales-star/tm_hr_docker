CREATE POLICY "public read perfil" ON storage.objects FOR SELECT USING (bucket_id = 'archivos_perfil');
CREATE POLICY "auth insert perfil" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'archivos_perfil' AND auth.role() = 'authenticated');
CREATE POLICY "auth update perfil" ON storage.objects FOR UPDATE USING (bucket_id = 'archivos_perfil' AND auth.role() = 'authenticated');
CREATE POLICY "auth delete perfil" ON storage.objects FOR DELETE USING (bucket_id = 'archivos_perfil' AND auth.role() = 'authenticated');
