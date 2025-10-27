-- Fix credential id: 53 to have correct sender_id
-- Change from sender_id: 1030 (staff) to sender_id: 1 (institution)
UPDATE credential 
SET sender_id = 1 
WHERE id = 53;

-- Verify the change
SELECT id, owner_id, sender_id, status, created_at 
FROM credential 
WHERE id = 53;
