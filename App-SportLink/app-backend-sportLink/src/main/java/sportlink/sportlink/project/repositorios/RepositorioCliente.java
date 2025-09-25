package sportlink.sportlink.project.repositorios;

import sportlink.sportlink.project.entidades.Cliente;
import sportlink.sportlink.project.repositorios.crud.CrudCliente;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RepositorioCliente {

    private final CrudCliente crudCliente;

    public RepositorioCliente(CrudCliente crudCliente) {
        this.crudCliente = crudCliente;
    }

    public List<Cliente> obtenerTodos(){
        return crudCliente.findAll();
    }

    public Optional<Cliente> obtenerPorPk(int pkCliente){
        return crudCliente.findById(pkCliente);
    }

    public Cliente crear(Cliente cliente){
        return crudCliente.save(cliente);
    }

    public Cliente actualizar(Cliente cliente){
        return crudCliente.save(cliente);
    }

    public void eliminar(Cliente cliente){
        crudCliente.delete(cliente);
    }

    public void eliminarTodos(){
        crudCliente.deleteAll();
    }

}
