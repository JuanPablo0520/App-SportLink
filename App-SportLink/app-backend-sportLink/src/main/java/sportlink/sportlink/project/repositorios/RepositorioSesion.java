package sportlink.sportlink.project.repositorios;


import sportlink.sportlink.project.entidades.Sesion;
import sportlink.sportlink.project.repositorios.crud.CrudSesion;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RepositorioSesion {

    private final CrudSesion crudSesion;

    public RepositorioSesion(CrudSesion crudSesion) {
        this.crudSesion = crudSesion;
    }

    public List<Sesion> obtenerTodos(){
        return crudSesion.findAll();
    }

    public Optional<Sesion> obtenerPorPk(int pkSesion){
        return crudSesion.findById(pkSesion);
    }

    public Sesion crear(Sesion sesion){
        return crudSesion.save(sesion);
    }

    public Sesion actualizar(Sesion sesion){
        return crudSesion.save(sesion);
    }

    public void eliminar(Sesion sesion){
        crudSesion.delete(sesion);
    }

    public void eliminarTodos(){
        crudSesion.deleteAll();
    }
}
