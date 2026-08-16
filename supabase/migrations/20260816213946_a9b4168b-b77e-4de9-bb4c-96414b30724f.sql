-- Fix migration to handle subquery restriction in trigger WHEN
CREATE OR REPLACE FUNCTION public.notify_trainer_on_student_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_trainer_id UUID;
    v_student_name TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_type TEXT;
    v_link TEXT;
    v_is_first_water_today BOOLEAN;
BEGIN
    -- 1. Identify the student and their trainer
    SELECT s.trainer_id, s.full_name 
    INTO v_trainer_id, v_student_name
    FROM public.students s
    WHERE s.id = NEW.student_id;
    
    IF v_trainer_id IS NULL THEN
        RETURN NEW;
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'checkins' THEN
            v_notification_title := '✅ Check-in realizado';
            v_notification_message := v_student_name || ' registrou o check-in de hoje. Treino feito: ' || 
                                     CASE WHEN NEW.training_done THEN 'Sim' ELSE 'Não' END || '.';
            v_notification_type := 'checkin';
            v_link := '/student/' || NEW.student_id;
            
        WHEN 'cardio_logs' THEN
            v_notification_title := '🏃 Cardio registrado';
            v_notification_message := v_student_name || ' registrou ' || NEW.duration_minutes || ' min de cardio.';
            v_notification_type := 'cardio';
            v_link := '/student/' || NEW.student_id;
            
        WHEN 'water_logs' THEN
            -- Handle water log summary/spam prevention inside the function since WHEN can't have subqueries
            SELECT NOT EXISTS (
                SELECT 1 FROM public.water_logs 
                WHERE student_id = NEW.student_id 
                  AND log_date = NEW.log_date 
                  AND id <> NEW.id
            ) INTO v_is_first_water_today;
            
            IF NOT v_is_first_water_today THEN
                RETURN NEW; -- Skip if not the first log of the day
            END IF;

            v_notification_title := '💧 Hidratação';
            v_notification_message := v_student_name || ' iniciou o registro de água de hoje.';
            v_notification_type := 'hydration';
            v_link := '/student/' || NEW.student_id;
            
        ELSE
            RETURN NEW;
    END CASE;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_trainer_id, v_notification_title, v_notification_message, v_notification_type, v_link);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS on_student_checkin ON public.checkins;
CREATE TRIGGER on_student_checkin
AFTER INSERT OR UPDATE OF training_done ON public.checkins
FOR EACH ROW
WHEN (NEW.training_done IS TRUE)
EXECUTE FUNCTION public.notify_trainer_on_student_activity();

DROP TRIGGER IF EXISTS on_student_cardio ON public.cardio_logs;
CREATE TRIGGER on_student_cardio
AFTER INSERT ON public.cardio_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_trainer_on_student_activity();

DROP TRIGGER IF EXISTS on_student_water ON public.water_logs;
CREATE TRIGGER on_student_water
AFTER INSERT ON public.water_logs
FOR EACH ROW
EXECUTE FUNCTION public.notify_trainer_on_student_activity();
