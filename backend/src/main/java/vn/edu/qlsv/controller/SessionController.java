package vn.edu.qlsv.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import vn.edu.qlsv.repository.UserAccountRepository;
import java.util.Map;

@RestController
public class SessionController {
    private final UserAccountRepository repo;

    public SessionController(UserAccountRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }

    @GetMapping("/api/me")
    public Map<String, Object> me(Authentication auth) {
        var u = repo.findByUsername(auth.getName()).orElseThrow();
        return Map.of("username", u.username, "role", u.role.name(), "id", u.id);
    }
}
