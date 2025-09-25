package sportlink.sportlink.project.repositorios.crud;

import sportlink.sportlink.project.entidades.Entrenador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrudEntrenador extends JpaRepository<Entrenador, Integer> {
}
