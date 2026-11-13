-- Test helpers live only in this connection and transaction. No SECURITY DEFINER.
CREATE FUNCTION pg_temp.check_true(ok boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%', message; END IF;
END $$;

CREATE FUNCTION pg_temp.expect_error(statement text, code text, message text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual_code text; actual_message text;
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS actual_code = RETURNED_SQLSTATE, actual_message = MESSAGE_TEXT;
    IF actual_code <> code OR position(message in actual_message) = 0 THEN
      RAISE EXCEPTION 'Wrong error: % %', actual_code, actual_message;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected denial but statement succeeded: %', statement;
END $$;
