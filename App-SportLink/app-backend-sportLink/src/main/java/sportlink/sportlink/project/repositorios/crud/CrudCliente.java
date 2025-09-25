package sportlink.sportlink.project.repositorios.crud;

import sportlink.sportlink.project.entidades.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrudCliente extends JpaRepository<Cliente, Integer> {
}
