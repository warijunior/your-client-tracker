
-- Appointments table for scheduling
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage own appointments" ON public.appointments FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "Students can view own appointments" ON public.appointments FOR SELECT USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = appointments.student_id AND s.user_id = auth.uid()));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Progress photos table
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  photo_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  notes TEXT,
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage student photos" ON public.progress_photos FOR ALL USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = progress_photos.student_id AND s.trainer_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = progress_photos.student_id AND s.trainer_id = auth.uid()));
CREATE POLICY "Students can view own photos" ON public.progress_photos FOR SELECT USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = progress_photos.student_id AND s.user_id = auth.uid()));
CREATE POLICY "Students can upload own photos" ON public.progress_photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = progress_photos.student_id AND s.user_id = auth.uid()));

-- Payments table for manual tracking
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  reference_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage payments" ON public.payments FOR ALL USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = payments.student_id AND s.user_id = auth.uid()));

-- Storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'progress-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING (bucket_id = 'progress-photos');
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
