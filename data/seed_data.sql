INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'System administrator with full access'),
(2, 'government_authority', 'Government oversight authority'),
(3, 'hospital', 'Hospital or transplant center staff'),
(4, 'blood_bank', 'Blood bank operator'),
(5, 'organ_donor', 'Registered organ donor'),
(6, 'blood_donor', 'Registered blood donor'),
(7, 'recipient', 'Organ or blood recipient');

INSERT INTO permissions (id, name, description) VALUES
(1, 'manage_all', 'Full system management access'),
(2, 'verify_entities', 'Verify hospitals, donors, recipients'),
(3, 'view_audit', 'View audit logs'),
(4, 'manage_users', 'Manage user accounts'),
(5, 'create_emergency', 'Create emergency requests'),
(6, 'manage_matches', 'Manage donor-recipient matches'),
(7, 'manage_inventory', 'Manage blood bank inventory'),
(8, 'manage_own_profile', 'Manage own profile'),
(9, 'update_consent', 'Update donation consent'),
(10, 'view_waitlist', 'View transplant waitlist');

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6),
(2, 2), (2, 3),
(3, 2), (3, 5), (3, 6),
(4, 7),
(5, 8), (5, 9),
(6, 8), (6, 9),
(7, 8), (7, 10);
