<template>
<q-page>
  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm spmd column justify-center">
    <div class="row q-mt-lg q-mb-md justify-around">
      <btn-cond icon="people" cond="cEdit"
        :label="$t('PGinvitation')" @ok="ui.setPage('invitation')"/>
      <btn-cond v-if="gSt.ambano[0]" icon="chat" :label="$t('PGchat')" cond="cVisu"
        @ok="this.ui.oD('ACGouvrir')"/>
    </div>

    <div>
      <apercu-genx :id="idg" :idx="0"/>

      <div v-if="gr.dfh" class="q-mr-sm">
        <q-icon name="warning" size="md" color="negative"/>
        <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
      </div>

      <div class="q-mr-sm">
        <q-icon v-if="nbiv" class="q-mr-xs" name="star" size="md" color="green-5"/>
        <span class="text-italic">{{$t('PGinv', nbiv, {count: nbiv})}}</span>
      </div>

      <div v-if="!gr.estRadie(1)" class="q-mt-sm titre-md q-mr-sm">{{$t('AGfond', [nom(1)])}}</div>
      <div v-else class="q-mt-sm fs-md text-italic">{{$t('AGnfond')}}</div>

      <div class="q-mt-sm row justify-between">
        <div v-if="gr.msu" class="titre-md text-bold text-warning">{{$t('AGunanime')}}</div>
        <div v-else class="titre-md">{{$t('AGsimple')}}</div>
        <btn-cond class="col-auto q-ml-sm self-start" size="sm" :label="$t('details')"
          icon="edit" @ok="editUna" cond="cVisu"/>
      </div>

      <div :class="'q-mt-xs q-pa-xs ' + bcf()">
        <div class="row justify-between">
          <div v-if="!gr.dfh" class="row">
            <span class="titre-md q-mr-sm">{{$t('AGheb')}}</span>
            <span class="fs-md">{{nom(gr.imh)}}</span>
          </div>
          <div v-else class="col fs-md text-warning text-bold">{{$t('AGnheb', [dhcool(dfh)])}}</div>
          <btn-cond class="col-auto q-ml-sm self-start" size="sm" cond="cEdit"
            :label="$t('gerer')" icon="settings" @ok="gererheb"/>
        </div>
        <quotas-vols class="q-mt-xs q-ml-md" :vols="vols" groupe/>
      </div>

      <div class="titre-md text-italic q-mt-xs">{{$t('AGstm')}}</div>
      <div class="row spsm items-center titre-md text-italic">
        <div v-for="i in 4" :key="i" class="col-3 text-center">{{$t('AGsts' + i)}}</div>
      </div>
      <div class="row spsm items-center font-mono">
        <div v-for="i in 4" :key="i" class="col-3 text-center">{{gr.sts[i]}}</div>
      </div>
    </div>

    <div class="titre-lg full-width text-center text-white bg-secondary q-mt-md q-mb-sm q-pa-xs">
      {{$t('PGmesav', sav.size)}}
    </div>
    <div v-if="sav.size">
      <div v-for="(id, idx) of sav" :key="id" class="q-mt-sm">
        <!--apercu-membre :id="id" :idx="idx"/-->
        <div>{{session.getCV(id).nom}}</div>
        <q-separator v-if="idx < (sav.size - 1)" color="orange"/>
      </div>
    </div>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC" class="q-pa-sm spmd">
    <div v-if="amb">
      <div v-if="!nb" class="titre-lg text-italic">
        {{$t('PGnope')}}</div>
      <div v-if="nb && !lst.length" class="titre-lg text-italic">
        {{$t('PGnomb', [nb])}}</div>
      <div v-if="lst.length">
        <div v-for="e of lst" :key="e.id">{{e.nom}}</div>
        <!--apercu-membre v-for="(e, idx) of lst" :key="e.id"
          class="q-my-lg" :idm="e.idm" :im="e.im" people :idx="idx"/-->
      </div>
    </div>
    <div v-else class="titre-lg text-italic">{{$t('PGnoamb')}}</div>
  </div>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
// import ApercuMembre from '../components/ApercuMembre.vue'
import { bcf, dhcool } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import QuotasVols from '../components/QuotasVols.vue'

export default {
  name: 'PageGroupe',

  components: { BtnCond, ApercuGenx, QuotasVols /*, ApercuMembre */},

  computed: {
    idg () { return this.session.groupeId },
    sav () { return this.session.compte.mpg.get(this.idg) || new Set() },
    gr () { return this.gSt.egrC ? this.gSt.egrC.groupe : null },
    nbiv () { return this.gr.nbInvits },
    amb () { return this.gSt.ambano[0] },
    lst () { return this.gSt.pgLmFT[0] },
    nb () { return this.gSt.pgLmFT[1] },
    vols () { return { qn: this.gr.qn, qv: this.gr.qv, n: this.gr.nn, v: this.gr.vf }},
  },

  methods: {
    nom (im) {
      const id = this.gr.tid[im]
      return id ? this.session.getCV(id).nomC : this.$t('inconnu')
    },
    editUna () { console.log('editUna') },
    gererheb () { console.log('gererHeb') },
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      bcf, dhcool,
      ui: stores.ui,
      session: stores.session,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.top3
  margin-top: 3rem
</style>
