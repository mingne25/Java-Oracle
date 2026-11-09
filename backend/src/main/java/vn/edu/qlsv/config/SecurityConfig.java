package vn.edu.qlsv.config;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.cors.*;
import vn.edu.qlsv.repository.UserAccountRepository;
import java.util.List;
@Configuration public class SecurityConfig {
 @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
 @Bean UserDetailsService userDetailsService(UserAccountRepository repo){return username->{var u=repo.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("Invalid credentials"));return User.withUsername(u.username).password(u.passwordHash).roles(u.role.name()).disabled(!Boolean.TRUE.equals(u.enabled)).build();};}
 @Bean CorsConfigurationSource corsConfigurationSource(){var c=new CorsConfiguration();c.setAllowedOrigins(List.of("http://localhost:3000"));c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));c.setAllowedHeaders(List.of("Authorization","Content-Type"));var s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;}
 @Bean SecurityFilterChain security(HttpSecurity http)throws Exception{return http.csrf(csrf->csrf.disable()).cors(Customizer.withDefaults()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/api/health").permitAll().requestMatchers("/api/admin/**").hasRole("ADMIN").requestMatchers(HttpMethod.GET,"/api/catalog/students","/api/catalog/students/**").hasAnyRole("ADMIN","TEACHER").requestMatchers(HttpMethod.GET,"/api/catalog/**").hasAnyRole("ADMIN","TEACHER").requestMatchers("/api/catalog/**").hasRole("ADMIN").requestMatchers("/api/teacher/**").hasRole("TEACHER").requestMatchers("/api/student/**").hasRole("STUDENT").requestMatchers("/api/me").authenticated().anyRequest().denyAll()).httpBasic(Customizer.withDefaults()).build();}
}