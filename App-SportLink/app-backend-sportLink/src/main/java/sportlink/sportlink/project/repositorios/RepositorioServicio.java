package sportlink.sportlink.project.repositorios;


import sportlink.sportlink.project.entidades.Servicio;
import sportlink.sportlink.project.repositorios.crud.CrudServicio;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RepositorioServicio {

    private final CrudServicio crudServicio;

    public RepositorioServicio(CrudServicio crudServicio) {
        this.crudServicio = crudServicio;
    }

    public List<Servicio> obtenerTodos(){
        return crudServicio.findAll();
    }

    public Optional<Servicio> obtenerPorPk(int pkServicio){
        return crudServicio.findById(pkServicio);
    }

    public Servicio crear(Servicio servicio){
        return crudServicio.save(servicio);
    }

    public Servicio actualizar(Servicio servicio){
        return crudServicio.save(servicio);
    }

    public void eliminar(Servicio servicio){
        crudServicio.delete(servicio);
    }

    public void eliminarTodos(){
        crudServicio.deleteAll();
    }
}
