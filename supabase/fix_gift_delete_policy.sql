-- Allow receivers to delete gifts they opened
CREATE POLICY "Users can delete gifts sent to them"
  ON user_gifts FOR DELETE
  USING (auth.uid() = receiver_id);

NOTIFY pgrst, 'reload schema';
