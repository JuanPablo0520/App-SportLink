package sportlink.sportlink.project.repositorios.crud;

import sportlink.sportlink.project.entidades.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrudSesion extends JpaRepository<Sesion, Integer> {
}
